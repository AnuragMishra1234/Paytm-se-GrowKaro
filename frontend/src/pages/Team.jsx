import React, { useState, useEffect } from "react";
import { useMerchantContext } from "../context/MerchantContext";
import { useTeam } from "../context/TeamContext";
import { inviteTeamMember, updateTeamMember, removeTeamMember } from "../services/api";
import { LoadingSpinner, ErrorState } from "../components/LoadingSpinner";

const ROLE_BADGES = {
  OWNER: {
    label: "Store Owner",
    bg: "bg-purple-50 text-purple-800 border-purple-200",
    dot: "bg-purple-500",
    desc: "Full administrative & financial visibility, strategic approval",
  },
  MANAGER: {
    label: "Store Manager",
    bg: "bg-blue-50 text-[#002970] border-blue-200",
    dot: "bg-[#002970]",
    desc: "Approval gate authority, team task dispatch & shift oversight",
  },
  MARKETING: {
    label: "Marketing Lead",
    bg: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    desc: "Promotional copy review, creative preparation & audience targeting",
  },
  STAFF: {
    label: "Store Operations / Staff",
    bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
    desc: "Counter readiness, inventory prep & store floor execution",
  },
};

export default function Team() {
  const { merchant } = useMerchantContext();
  const {
    currentRole,
    switchRole,
    teamMembers,
    loadingTeam,
    refreshTeam,
    canManageTeam,
  } = useTeam();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "STAFF",
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) {
      setError("Name and email are required.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await inviteTeamMember(merchant._id, inviteForm);
      setStatusMessage(`Invitation dispatched to ${inviteForm.name} (${inviteForm.role})`);
      setShowInviteModal(false);
      setInviteForm({ name: "", email: "", phone: "", role: "STAFF" });
      await refreshTeam(merchant._id);
    } catch (err) {
      setError(err.message || "Failed to invite team member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (member) => {
    if (!window.confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
      return;
    }
    try {
      await removeTeamMember(member._id);
      setStatusMessage(`${member.name} has been removed from the team`);
      await refreshTeam(merchant._id);
    } catch (err) {
      setError(err.message || "Failed to remove member");
    }
  };

  const handleToggleStatus = async (member) => {
    try {
      const nextStatus = member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      await updateTeamMember(member._id, { status: nextStatus });
      setStatusMessage(`Updated ${member.name}'s status to ${nextStatus}`);
      await refreshTeam(merchant._id);
    } catch (err) {
      setError(err.message || "Failed to update member status");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Merchant Team &amp; Workflows</h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#002970] border border-blue-200">
              {teamMembers.length} Members
            </span>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Coordinate role-based task distribution. When actions are approved, GrowKaro automatically directs actionable tasks to the right employees.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshTeam(merchant?._id)}
            className="px-3 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-2xs transition-all flex items-center gap-1.5"
            title="Refresh team roster"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>

          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 text-xs md:text-sm font-bold text-white bg-[#002970] hover:bg-[#001f56] rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Invite Member
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs md:text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-700 hover:text-emerald-950 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs md:text-sm font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-950 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Team Roster Grid */}
      {loadingTeam && teamMembers.length === 0 ? (
        <div className="py-16">
          <LoadingSpinner message="Loading team roster..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teamMembers.map((member) => {
            const roleConfig = ROLE_BADGES[member.role] || ROLE_BADGES.STAFF;
            const isSelf = currentRole === member.role;

            return (
              <div
                key={member._id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-2xs relative overflow-hidden ${
                  isSelf ? "border-[#002970] ring-2 ring-[#002970]/10" : "border-gray-200/80 hover:border-gray-300"
                }`}
              >
                {isSelf && (
                  <div className="absolute top-0 right-0 bg-[#002970] text-white text-xs font-black uppercase px-2.5 py-0.5 rounded-bl-lg tracking-wider">
                    You
                  </div>
                )}

                <div>
                  {/* Avatar & Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-black text-gray-700 shadow-2xs shrink-0">
                      {member.avatar || member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-black text-gray-900 truncate leading-snug">
                        {member.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleConfig.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${roleConfig.dot}`} />
                        {roleConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                    {roleConfig.desc}
                  </p>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-gray-600 mb-4 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 truncate">
                      <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 truncate">
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Active Tasks Counter */}
                  <div className="flex items-center justify-between text-xs py-2 border-t border-gray-100 mb-3">
                    <span className="text-gray-500 font-medium">Active Tasks:</span>
                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                      {member.activeTaskCount || 0}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => switchRole(member.role)}
                    className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${
                      isSelf
                        ? "text-[#002970] bg-blue-50/80 cursor-default"
                        : "text-gray-600 hover:text-gray-950 hover:bg-gray-100"
                    }`}
                  >
                    {isSelf ? "Active View" : "Switch to Role"}
                  </button>

                  {member.role !== "OWNER" && canManageTeam && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(member)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        title={member.status === "ACTIVE" ? "Suspend member" : "Activate member"}
                      >
                        <span className="text-xs font-bold uppercase">{member.status === "ACTIVE" ? "Pause" : "Resume"}</span>
                      </button>
                      <button
                        onClick={() => handleRemove(member)}
                        className="p-1 rounded-md text-rose-400 hover:text-rose-700 hover:bg-rose-50"
                        title="Remove member"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role-Based Agentic Dispatch Matrix */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-black text-gray-900">Autonomous Workflow Routing Architecture</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            GrowKaro coordinates your merchant team at every stage of the agentic loop without manual management overhead.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-[#002970] flex items-center justify-center text-sm font-black">👔</span>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">Store Manager (Priya Sharma)</h4>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Holds the strategic approval gate. Approves AI recommendations, reviews financial pulses, and assigns tasks across merchant team members.
            </p>
            <div className="text-xs font-semibold text-[#002970] pt-1">
              Authority: Executive Approval Gate &amp; Business Analytics
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-black">📣</span>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">Marketing Lead (Rahul Verma)</h4>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Assigned campaign creative prep, WhatsApp promotional copy validation, AI customer loyalty opportunities, and campaign lift attribution.
            </p>
            <div className="text-xs font-semibold text-amber-800 pt-1">
              Scope: WhatsApp Campaigns &amp; Customer Loyalty
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-black">☕</span>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">Store Staff &amp; Barista (Ananya Das)</h4>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Assigned physical inventory readiness, beverage batch preparation, and counter briefings ahead of promotional spikes.
            </p>
            <div className="text-xs font-semibold text-emerald-800 pt-1">
              Scope: Store Floor Checklist &amp; Shift Readiness
            </div>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900">Invite Team Member</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Add an employee to collaborate on store operations and tasks.
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="e.g. Karan Patel"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002970]/20 focus:border-[#002970]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="karan@cafearoma.in"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002970]/20 focus:border-[#002970]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002970]/20 focus:border-[#002970]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Role &amp; Responsibilities *
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002970]/20 focus:border-[#002970] bg-white font-medium text-gray-800"
                >
                  <option value="STAFF">Floor Staff (Counter &amp; Stock Readiness)</option>
                  <option value="MARKETING">Marketing Lead (Promotions &amp; Customer Copy)</option>
                  <option value="MANAGER">Store Manager (Action Approvals &amp; Team Oversight)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs md:text-sm font-bold text-white bg-[#002970] hover:bg-[#001f56] rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
