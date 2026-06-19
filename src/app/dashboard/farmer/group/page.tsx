'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import GroupOrderCard from '@/components/foodhub/GroupOrderCard';
import { VerificationBadge } from '@/components/app';
import { cn } from '@/lib/cn';
import { Role } from '@/types';

interface IGroup {
  _id: string;
  groupName: string;
  county: string;
  memberCount: number;
  status: string;
  createdBy: string;
  createdAt: string;
}

interface IGroupMember {
  _id: string;
  firstName?: string;
  lastName?: string;
  county?: string;
  farmerData?: { isVerified?: boolean };
}

interface IGroupDetail extends IGroup {
  members: IGroupMember[];
}

interface IGroupOrder {
  _id: string;
  supplierId: { businessName: string; county: string } | string;
  inputType: string;
  quantityPerMember: number;
  pricePerMember: number;
  joiningDeadline: string;
  minimumMembers: number;
  participatingMembers: unknown[];
  status: string;
  proposedBy: string;
}

function GroupSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="skeleton h-32 rounded-app-card border border-app-hairline" />
      ))}
    </div>
  );
}

function memberName(member: IGroupMember): string {
  const full = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
  return full || 'Farmer';
}

export default function FarmerGroupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<IGroupDetail | null>(null);
  const [groupOrders, setGroupOrders] = useState<IGroupOrder[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const userId = session?.user.id;

  const fetchGroups = useCallback(async (): Promise<void> => {
    setIsLoadingGroups(true);
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = (await res.json()) as { data: IGroup[] };
        setGroups(data.data ?? []);
      } else if (res.status === 401 || res.status === 403) {
        router.push('/auth/unauthorized');
      }
    } finally {
      setIsLoadingGroups(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      if (session.user.role !== Role.FARMER) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchGroups();
    }
  }, [status, session, router, fetchGroups]);

  async function selectGroup(group: IGroup): Promise<void> {
    setIsLoadingDetail(true);
    setSelectedGroup({ ...group, members: [] });
    setGroupOrders([]);
    try {
      const [detailRes, ordersRes] = await Promise.all([
        fetch(`/api/groups/${group._id}`),
        fetch(`/api/groups/${group._id}/orders`),
      ]);
      if (detailRes.ok) {
        const detail = (await detailRes.json()) as { data: IGroupDetail };
        setSelectedGroup(detail.data);
      }
      if (ordersRes.ok) {
        const orders = (await ordersRes.json()) as { data: IGroupOrder[] };
        setGroupOrders(orders.data ?? []);
      }
    } finally {
      setIsLoadingDetail(false);
    }
  }

  function getSupplierName(order: IGroupOrder): string {
    if (typeof order.supplierId === 'object' && order.supplierId !== null) {
      return order.supplierId.businessName;
    }
    return 'Supplier';
  }

  const isManager = Boolean(selectedGroup && userId && selectedGroup.createdBy === userId);

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <GroupSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header — read-only hub: no create/join controls */}
      <div>
        <h1 className="app-h1 text-app-ink">Farmer Groups</h1>
        <p className="app-meta mt-0.5 max-w-prose text-app-muted">
          View your cooperative rosters and collective input-purchase history. Membership is
          managed by an administrator.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Groups list */}
        <div className="lg:col-span-1">
          <h2 className="app-h2 mb-4 text-app-ink">Your Groups</h2>
          {isLoadingGroups ? (
            <GroupSkeleton />
          ) : groups.length === 0 ? (
            <div className="rounded-app-card border border-app-hairline bg-app-card py-12 text-center">
              <p className="app-body mb-2 text-app-muted">No groups yet</p>
              <p className="app-meta text-app-faint">
                An administrator can add you to a cooperative, or you can link an institutional
                group token from your settings.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => void selectGroup(group)}
                  className={cn(
                    'min-h-[44px] w-full rounded-app-card border p-4 text-left transition-colors duration-150',
                    selectedGroup?._id === group._id
                      ? 'border-app-brand-border bg-app-sunken'
                      : 'border-app-hairline bg-app-card hover:bg-app-sunken'
                  )}
                >
                  <p className="app-body-strong text-app-ink">{group.groupName}</p>
                  <p className="app-meta mt-1 text-app-muted">
                    {group.county} · {group.memberCount} member
                    {group.memberCount !== 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Group detail */}
        <div className="lg:col-span-2">
          {!selectedGroup ? (
            <div className="flex h-48 items-center justify-center rounded-app-card border border-app-hairline bg-app-card">
              <p className="app-body text-app-muted">
                Select a group to see its roster and order history
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group header + manager variant */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="app-h2 text-app-ink">{selectedGroup.groupName}</h2>
                  <p className="app-meta mt-1 text-app-muted">
                    {selectedGroup.county} · {selectedGroup.memberCount} member
                    {selectedGroup.memberCount !== 1 ? 's' : ''}
                  </p>
                </div>
                {isManager && (
                  <span className="app-label inline-flex items-center rounded-app-pill bg-app-brand-surface px-2 py-0.5 text-app-brand">
                    Manager
                  </span>
                )}
              </div>

              {isManager && (
                <p className="app-meta text-app-faint">
                  You created this group. Member additions and removals are handled by an
                  administrator.
                </p>
              )}

              {/* Off-platform payment notice (plain text) */}
              <div className="rounded-app-control border border-app-hairline bg-app-sunken p-4">
                <p className="app-body text-app-muted">
                  Payment for group orders is coordinated off-platform. UmojaHub does not process
                  or hold group-order payments.
                </p>
              </div>

              {/* Roster — no payment badges, no member controls */}
              <section>
                <h3 className="app-title mb-3 text-app-ink">Roster</h3>
                {isLoadingDetail ? (
                  <GroupSkeleton />
                ) : selectedGroup.members.length === 0 ? (
                  <div className="rounded-app-card border border-app-hairline bg-app-card py-8 text-center">
                    <p className="app-body text-app-muted">No members to show.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
                    {selectedGroup.members.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-between gap-3 border-b border-app-hairline px-4 py-3 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="app-body truncate text-app-ink">
                            {memberName(member)}
                            {member._id === userId && (
                              <span className="font-normal text-app-faint"> · You</span>
                            )}
                            {member._id === selectedGroup.createdBy && (
                              <span className="font-normal text-app-faint"> · Creator</span>
                            )}
                          </p>
                          {member.county && (
                            <p className="app-meta text-app-faint">{member.county}</p>
                          )}
                        </div>
                        <VerificationBadge
                          state={member.farmerData?.isVerified ? 'verified' : 'pending'}
                          label={member.farmerData?.isVerified ? 'Verified' : 'Unverified'}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Group order histories */}
              <section>
                <h3 className="app-title mb-3 text-app-ink">Group orders</h3>
                {isLoadingDetail ? (
                  <GroupSkeleton />
                ) : groupOrders.length === 0 ? (
                  <div className="rounded-app-card border border-app-hairline bg-app-card py-8 text-center">
                    <p className="app-body text-app-muted">
                      No group orders for this cooperative yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupOrders.map((order) => (
                      <GroupOrderCard
                        key={order._id}
                        groupOrderId={order._id}
                        supplierId={
                          typeof order.supplierId === 'string'
                            ? order.supplierId
                            : (order.supplierId as { _id?: string } | null)?._id ?? ''
                        }
                        supplierName={getSupplierName(order)}
                        inputType={order.inputType}
                        quantityPerMember={order.quantityPerMember}
                        pricePerMember={order.pricePerMember}
                        joiningDeadline={order.joiningDeadline}
                        minimumMembers={order.minimumMembers}
                        currentMemberCount={order.participatingMembers.length}
                        status={order.status}
                        proposedBy={order.proposedBy}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
