'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GroupOrderCard from '@/components/foodhub/GroupOrderCard';
import { KENYAN_COUNTIES } from '@/types';

interface IGroup {
  _id: string;
  groupName: string;
  county: string;
  memberCount: number;
  status: string;
  createdAt: string;
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
            backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      ))}
    </div>
  );
}

export default function FarmerGroupPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<IGroup | null>(null);
  const [groupOrders, setGroupOrders] = useState<IGroupOrder[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupCounty, setGroupCounty] = useState('Kiambu');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    void fetchGroups();
  }, []);

  async function fetchGroups() {
    setIsLoadingGroups(true);
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json() as { data: IGroup[] };
        setGroups(data.data ?? []);
      } else if (res.status === 401 || res.status === 403) {
        router.push('/auth/unauthorized');
      }
    } finally {
      setIsLoadingGroups(false);
    }
  }

  async function selectGroup(group: IGroup) {
    setSelectedGroup(group);
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`/api/groups/${group._id}/orders`);
      if (res.ok) {
        const data = await res.json() as { data: IGroupOrder[] };
        setGroupOrders(data.data ?? []);
      }
    } finally {
      setIsLoadingOrders(false);
    }
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName, county: groupCounty }),
      });
      if (res.ok) {
        setCreateFormOpen(false);
        setGroupName('');
        await fetchGroups();
      } else {
        const err = await res.json() as { error: string };
        setCreateError(err.error ?? 'Failed to create group');
      }
    } finally {
      setIsCreating(false);
    }
  }

  function getSupplierName(order: IGroupOrder): string {
    if (typeof order.supplierId === 'object' && order.supplierId !== null) {
      return order.supplierId.businessName;
    }
    return 'Supplier';
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-5xl mx-auto px-4 py-8 md:px-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-heading text-t1 text-text-primary mb-2">Farmer Groups</h1>
            <p className="font-body text-t4 text-text-secondary">
              Join a cooperative to purchase inputs collectively and reduce costs.
            </p>
          </div>
          <button
            onClick={() => setCreateFormOpen(true)}
            className="px-4 py-3 bg-accent-green text-white rounded-sm font-body text-t5 hover:opacity-90 transition-all duration-150 min-h-[44px]"
          >
            Create Group
          </button>
        </div>

        {/* Create group form */}
        {createFormOpen && (
          <div className="mb-8 bg-surface-elevated border border-white/5 rounded p-6">
            <h2 className="font-heading text-t2 text-text-primary mb-4">New Cooperative Group</h2>
            <form onSubmit={(e) => void createGroup(e)} className="space-y-4">
              <div>
                <label className="block font-body text-t5 text-text-secondary mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Kiambu Maize Farmers Cooperative"
                  required
                  minLength={3}
                  maxLength={100}
                  className="w-full bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled focus:outline-none focus:border-accent-green/50 transition-all duration-150 min-h-[44px]"
                />
              </div>
              <div>
                <label className="block font-body text-t5 text-text-secondary mb-1">County</label>
                <select
                  value={groupCounty}
                  onChange={(e) => setGroupCounty(e.target.value)}
                  className="w-full bg-surface-secondary border border-white/5 rounded-sm px-3 py-2 font-body text-t5 text-text-primary focus:outline-none focus:border-accent-green/50 min-h-[44px]"
                >
                  {KENYAN_COUNTIES.map((c) => (
                    <option key={c} value={c} className="bg-surface-elevated">{c}</option>
                  ))}
                </select>
              </div>
              {createError && (
                <p className="font-body text-t5 text-red-400">{createError}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-3 bg-accent-green text-white rounded-sm font-body text-t5 disabled:opacity-40 hover:opacity-90 transition-all duration-150 min-h-[44px]"
                >
                  {isCreating ? 'Creating...' : 'Create Group'}
                </button>
                <button
                  type="button"
                  onClick={() => setCreateFormOpen(false)}
                  className="px-6 py-3 bg-surface-secondary text-text-secondary border border-white/5 rounded-sm font-body text-t5 hover:text-text-primary transition-all duration-150 min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

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
                  Create a group to start purchasing inputs collectively with other farmers.
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
                      {group.county} · {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Group orders */}
          <div className="lg:col-span-2">
            {selectedGroup ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-t2 text-text-primary">
                    {selectedGroup.groupName}
                  </h2>
                </div>
                {isLoadingOrders ? (
                  <GroupSkeleton />
                ) : groupOrders.length === 0 ? (
                  <div className="text-center py-12 bg-surface-elevated border border-white/5 rounded">
                    <p className="font-body text-t4 text-text-secondary mb-2">No group orders yet</p>
                    <p className="font-body text-t5 text-text-disabled">
                      Propose a collective input purchase once your group has at least 5 members.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupOrders.map((order) => (
                      <GroupOrderCard
                        key={order._id}
                        groupOrderId={order._id}
                        supplierId={typeof order.supplierId === 'string' ? order.supplierId : (order.supplierId as { _id?: string })._id ?? ''}
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
              </>
            ) : (
              <div className="flex items-center justify-center h-48 bg-surface-elevated border border-white/5 rounded">
                <p className="font-body text-t5 text-text-disabled">
                  Select a group to see group orders
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
