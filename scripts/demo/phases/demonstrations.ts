// Demonstrations, and the times lecturers offer for them.
//
// Runs after the engagements exist, because a demonstration is an appointment
// about a project and cannot be written before there is one. Doing it as a
// second pass rather than weaving it through the engagement loop keeps both
// readable, and means the guarantees below are stated in one place instead of
// being scattered through a dozen coin tosses.
//
// Four things must be true of the world this produces, and each is arranged
// deliberately rather than left to the dice:
//
//   1. Every verified lecturer has open times a student can actually book.
//   2. Every verified lecturer has a request waiting on them.
//   3. Every verified lecturer has a confirmed demonstration coming up.
//   4. Every completed project has an evaluated demonstration behind it —
//      because in this workflow a project cannot be complete without one, and a
//      seeded world that contradicted its own rules is worse than an empty one.

import type { SimContext, World } from '../world';
import { createDoc, pushNotification } from '../helpers';
import { daysAgo, daysAfter } from '../clock';
import {
  ProjectStatus,
  SubmissionStatus,
  DocumentationOutcome,
  DOCUMENTATION_CHECKLIST,
  SlotStatus,
  DemonstrationStatus,
  DemonstrationFormat,
  DemonstrationOutcome,
  DEMONSTRATION_CRITERIA,
  NotificationType,
} from '../../../src/types';
import { demonstrationComment, studentDemonstrationNotes, questioningNotes } from '../text';

/** A slot at a whole or half hour, which is how anybody actually books time. */
function onTheHour(base: Date, hour: number): Date {
  const d = new Date(base);
  d.setHours(hour, 0, 0, 0);
  return d;
}

export async function generateDemonstrations(ctx: SimContext, world: World): Promise<void> {
  const { rng, ledger, batcher } = ctx;

  const { default: ProjectEngagement } = await import(
    '../../../src/lib/models/ProjectEngagement.model'
  );
  const { default: ProjectDocumentation } = await import(
    '../../../src/lib/models/ProjectDocumentation.model'
  );
  const { default: Demonstration } = await import('../../../src/lib/models/Demonstration.model');
  const { default: DemonstrationSlot } = await import(
    '../../../src/lib/models/DemonstrationSlot.model'
  );

  const mongooseLib = (await import('mongoose')).default;
  const now = new Date();

  // Lecturers at one institution share a cohort, so without this the same
  // engagement is promoted twice. The second promotion moves the project to a
  // demonstration state while its report — already accepted by the first — no
  // longer matches the filter that accepts one, leaving a project whose
  // standing disagrees with its own report.
  const alreadyPromoted = new Set<string>();

  for (const lecturer of world.lecturers) {
    if (!lecturer.institutionId) continue;
    const institutionId = lecturer.institutionId;

    const cohort = world.students.filter(
      (s) => s.institutionId && String(s.institutionId) === String(institutionId)
    );
    if (cohort.length === 0) continue;

    const location =
      rng.bool(0.75)
        ? `https://meet.jit.si/umojahub-${String(lecturer.id).slice(-8)}`
        : `Lab ${rng.int(1, 4)}, Computing Block`;
    const format = location.startsWith('http')
      ? DemonstrationFormat.VIDEO_CALL
      : DemonstrationFormat.IN_PERSON;

    /** Publish one slot. Every slot this seeder writes is a real, bookable time. */
    const slot = async (startsAt: Date, status: string) =>
      ledger.track(
        'DemonstrationSlot',
        await createDoc(DemonstrationSlot, {
          lecturerId: lecturer.id,
          institutionId,
          startsAt,
          durationMinutes: rng.pick([30, 45, 45, 60]),
          format,
          location,
          status,
          createdAt: daysAgo(rng.int(10, 30)),
          updatedAt: daysAgo(rng.int(1, 9)),
        })
      );

    // ---- 1. Open times, so a student who is ready can book one today ----
    //
    // Spread over the coming fortnight at hours somebody would actually
    // choose. Without these the whole demonstration workflow is unreachable
    // from the student's screen: they reach "book a demonstration" and find
    // nothing on offer.
    const openSlots = [];
    for (let d = 2; d <= 12; d += rng.int(2, 4)) {
      const day = daysAfter(now, d);
      openSlots.push(await slot(onTheHour(day, rng.pick([9, 10, 11, 14, 15, 16])), SlotStatus.OPEN));
    }

    // ---- 4. Completed projects need the demonstration behind them ----
    const completed = await ProjectEngagement.find({
      studentId: { $in: cohort.map((s) => s.id) },
      status: ProjectStatus.VERIFIED,
    } as object)
      .select('_id studentId revisionNumber verifiedAt brief.title')
      .lean();

    for (const engagement of completed) {
      const verifiedAt = (engagement as { verifiedAt?: Date }).verifiedAt ?? daysAgo(rng.int(5, 40));
      // Never in the future. `verifiedAt` is computed forward from when the
      // project started, so a recently-started project could carry one that has
      // not arrived yet — and a demonstration carrying an evaluation for a
      // meeting that has not happened is a record of nothing.
      const heldCandidate = daysAfter(verifiedAt, -rng.int(1, 3));
      const heldAt =
        heldCandidate.getTime() < Date.now() ? heldCandidate : daysAgo(rng.int(2, 9));
      const pastSlot = await slot(heldAt, SlotStatus.BOOKED);

      const approved = {
        scores: Object.fromEntries(DEMONSTRATION_CRITERIA.map((c) => [c, rng.int(3, 5)])),
        comments: Object.fromEntries(
          DEMONSTRATION_CRITERIA.map((c) => [c, demonstrationComment(rng, c, true)])
        ),
        outcome: DemonstrationOutcome.APPROVED,
        questioningNotes: questioningNotes(rng, true),
        ...(rng.bool(0.3)
          ? {
              failureDuringDemonstration:
                'The deployed instance had cold-started and the first request timed out. They said what they thought was happening, warmed it and carried on without losing the thread.',
            }
          : {}),
        evaluatedAt: verifiedAt,
      };

      const demonstration = ledger.track(
        'Demonstration',
        await createDoc(Demonstration, {
          engagementId: engagement._id,
          studentId: engagement.studentId,
          lecturerId: lecturer.id,
          slotId: pastSlot._id,
          scheduledFor: heldAt,
          durationMinutes: pastSlot.durationMinutes,
          format,
          location,
          studentNotes: studentDemonstrationNotes(rng),
          status: DemonstrationStatus.EVALUATED,
          revisionNumber: (engagement as { revisionNumber?: number }).revisionNumber ?? 0,
          completedAt: heldAt,
          evaluation: approved,
          createdAt: daysAfter(heldAt, -rng.int(3, 10)),
          updatedAt: verifiedAt,
        })
      );

      await DemonstrationSlot.updateOne(
        { _id: pastSlot._id },
        { $set: { demonstrationId: demonstration._id } }
      );
    }

    // ---- 2 and 3. A request waiting, and a session coming up ----
    //
    // Promoted from projects whose report is already with the lecturer, because
    // a demonstration is only bookable once a report has been accepted — and a
    // project still being built has no report at all. Promoting those produced
    // exactly what the workflow forbids: a project ready to demonstrate with
    // nothing submitted behind it, and a version the acceptance below could
    // never find.
    //
    // `skip(1)` leaves the oldest submission where it is. The queue guarantee
    // exists for a reason, and emptying it to fill this one would trade one
    // empty screen for another.
    const promotable = await ProjectEngagement.find({
      studentId: { $in: cohort.map((s) => s.id) },
      status: ProjectStatus.UNDER_LECTURER_REVIEW,
      _id: { $nin: [...alreadyPromoted].map((id) => new mongooseLib.Types.ObjectId(id)) },
    } as object)
      .select('_id studentId revisionNumber brief.title')
      .sort({ createdAt: 1 })
      .skip(1)
      .limit(2)
      .lean();

    const promotions: Array<'REQUESTED' | 'SCHEDULED'> = ['REQUESTED', 'SCHEDULED'];

    for (let i = 0; i < promotable.length && i < promotions.length; i++) {
      const engagement = promotable[i]!;
      const outcome = promotions[i]!;
      alreadyPromoted.add(String(engagement._id));
      const acceptedAt = daysAgo(rng.int(2, 9));

      // Their report was read and accepted — a demonstration is only bookable
      // after that, so the record has to say so or the world contradicts its
      // own rule.
      await ProjectDocumentation.updateOne(
        { engagementId: engagement._id } as object,
        {
          $set: {
            'versions.$[latest].status': SubmissionStatus.READY_FOR_DEMONSTRATION,
            'versions.$[latest].review': {
              lecturerId: lecturer.id,
              outcome: DocumentationOutcome.READY_FOR_DEMONSTRATION,
              scores: {
                problemUnderstanding: rng.int(3, 5),
                solutionQuality: rng.int(3, 5),
                processQuality: rng.int(3, 5),
                aiUsage: rng.int(3, 5),
              },
              summary:
                'The report holds together and the architecture section does the work it needs to — you have said what you chose and what you rejected. Bring the synchronisation flow to the demonstration and be ready to talk about what happens when two devices disagree.',
              questionsForDemonstration:
                'What happens when two devices disagree about the same record, and why that resolution and not another.',
              pageNotes: [],
              checklist: DOCUMENTATION_CHECKLIST.map((item) => ({ item, met: true })),
              reviewedAt: acceptedAt,
            },
          },
        } as object,
        { arrayFilters: [{ 'latest.status': SubmissionStatus.SUBMITTED }] }
      );

      const target = outcome === 'REQUESTED' ? openSlots[0] : openSlots[1];
      if (!target) continue;

      const demonstration = ledger.track(
        'Demonstration',
        await createDoc(Demonstration, {
          engagementId: engagement._id,
          studentId: engagement.studentId,
          lecturerId: lecturer.id,
          slotId: target._id,
          scheduledFor: target.startsAt,
          durationMinutes: target.durationMinutes,
          format,
          location,
          studentNotes: studentDemonstrationNotes(rng),
          status:
            outcome === 'REQUESTED'
              ? DemonstrationStatus.REQUESTED
              : DemonstrationStatus.SCHEDULED,
          revisionNumber: (engagement as { revisionNumber?: number }).revisionNumber ?? 0,
          createdAt: daysAfter(acceptedAt, 1),
          updatedAt: daysAfter(acceptedAt, 1),
        })
      );

      await DemonstrationSlot.updateOne(
        { _id: target._id },
        { $set: { status: SlotStatus.BOOKED, demonstrationId: demonstration._id } }
      );
      // Consumed, so the next promotion does not book the same time.
      openSlots.splice(openSlots.indexOf(target), 1);

      await ProjectEngagement.updateOne(
        { _id: engagement._id },
        {
          $set: {
            status:
              outcome === 'REQUESTED'
                ? ProjectStatus.READY_FOR_DEMONSTRATION
                : ProjectStatus.DEMONSTRATION_SCHEDULED,
            updatedAt: daysAfter(acceptedAt, 1),
          },
        }
      );

      await pushNotification(batcher, {
        userId: engagement.studentId,
        type: NotificationType.REVIEW_UPDATE,
        title:
          outcome === 'REQUESTED'
            ? 'Your report was accepted — you can book your demonstration'
            : 'Your demonstration is confirmed',
        body:
          outcome === 'REQUESTED'
            ? 'Your lecturer has read your report and accepted it. The next step is to show them the system running.'
            : 'Your lecturer has confirmed your demonstration. Have the system running and be ready to explain your decisions.',
        relatedEntity: { kind: 'ProjectEngagement', id: engagement._id },
        createdAt: daysAfter(acceptedAt, 1),
      });

      if (outcome === 'REQUESTED') {
        await pushNotification(batcher, {
          userId: lecturer.id,
          type: NotificationType.REVIEW_UPDATE,
          title: 'A student requested a demonstration',
          body: 'A student has asked to demonstrate their system in one of the times you offered. Confirm it or decline with a reason.',
          relatedEntity: { kind: 'ProjectEngagement', id: engagement._id },
          createdAt: daysAfter(acceptedAt, 1),
        });
      }
    }
  }
}
