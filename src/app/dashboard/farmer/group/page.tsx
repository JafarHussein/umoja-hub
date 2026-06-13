'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import GroupOrderCard from '@/components/foodhub/GroupOrderCard';
import { Badge } from '@/components/ui/Badge';
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
        <div
          key={i}
          className="h-32 bg-surface-secondary border border-white/5 rounded animate-shimmer"
          style={{
            backgroundImage:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />
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
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-5xl mx-auto px-4 py-8 md:px-8">
          <GroupSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-5xl mx-auto px-4 py-8 md:px-8">
        {/* Header — read-only hub: no create/join controls */}
        <div className="mb-8">
          <h1 className="font-heading text-t1 text-text-primary mb-2">Farmer Groups</h1>
          <p className="font-body text-t4 text-text-secondary">
            View your cooperative rosters and collective input-purchase history. Membership is
            managed by an administrator.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Groups list */}
          <div className="lg:col-span-1">
            <h2 className="font-heading text-t2 text-text-primary mb-4">Your Groups</h2>
            {isLoadingGroups ? (
              <GroupSkeleton />
            ) : groups.length === 0 ? (
              <div className="text-center py-12 bg-surface-elevated border border-white/5 rounded">
                <p className="font-body text-t4 text-text-secondary mb-2">No groups yet</p>
                <p className="font-body text-t5 text-text-disabled">
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
                    className={`w-full text-left p-4 bg-surface-elevated border rounded transition-all duration-150 min-h-[44px] ${
                      selectedGroup?._id === group._id
                        ? 'border-accent-green/40 bg-surface-secondary'
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <p className="font-body text-t4 text-text-primary">{group.groupName}</p>
                    <p className="font-body text-t5 text-text-secondary mt-1">
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
              <div className="flex items-center justify-center h-48 bg-surface-elevated border border-white/5 rounded">
                <p className="font-body text-t5 text-text-disabled">
                  Select a group to see its roster and order history
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Group header + manager variant */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-t2 text-text-primary">
                      {selectedGroup.groupName}
                    </h2>
                    <p className="font-body text-t5 text-text-secondary mt-1">
                      {selectedGroup.county} · {selectedGroup.memberCount} member
                      {selectedGroup.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {isManager && <Badge variant="success" label="Manager" />}
                </div>

                {isManager && (
                  <p className="font-body text-t6 text-text-disabled">
                    You created this group. Member additions and removals are handled by an
                    administrator.
                  </p>
                )}

                {/* Off-platform payment notice (plain text) */}
                <div className="bg-surface-secondary border border-white/5 rounded p-4">
                  <p className="font-body text-t5 text-text-secondary">
                    Payment for group orders is coordinated off-platform. UmojaHub does not
                    process or hold group-order payments.
                  </p>
                </div>

                {/* Roster — no payment badges, no member controls */}
                <section>
                  <h3 className="font-heading text-t3 text-text-primary mb-3">Roster</h3>
                  {isLoadingDetail ? (
                    <GroupSkeleton />
                  ) : selectedGroup.members.length === 0 ? (
                    <div className="text-center py-8 bg-surface-elevated border border-white/5 rounded">
                      <p className="font-body text-t5 text-text-disabled">No members to show.</p>
                    </div>
                  ) : (
                    <div className="bg-surface-elevated border border-white/5 rounded overflow-hidden">
                      {selectedGroup.members.map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 last:border-0"
                        >
                          <div className="min-w-0">
                            <p className="font-body text-t5 text-text-primary truncate">
                              {memberName(member)}
                              {member._id === userId && (
                                <span className="text-text-disabled font-normal"> · You</span>
                              )}
                              {member._id === selectedGroup.createdBy && (
                                <span className="text-text-disabled font-normal"> · Creator</span>
                              )}
                            </p>
                            {member.county && (
                              <p className="font-body text-t6 text-text-disabled">{member.county}</p>
                            )}
                          </div>
                          <Badge
                            variant={member.farmerData?.isVerified ? 'success' : 'warning'}
                            label={member.farmerData?.isVerified ? 'Verified' : 'Unverified'}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Group order histories */}
                <section>
                  <h3 className="font-heading text-t3 text-text-primary mb-3">Group orders</h3>
                  {isLoadingDetail ? (
                    <GroupSkeleton />
                  ) : groupOrders.length === 0 ? (
                    <div className="text-center py-8 bg-surface-elevated border border-white/5 rounded">
                      <p className="font-body text-t5 text-text-disabled">
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
    </div>
  );
}
