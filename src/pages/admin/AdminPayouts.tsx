import { useState } from "react";
import { Icon } from "../../components/Icon";
import { money } from "../../lib/utils";
import { useAdminPayouts, type AdminPayout, type PayoutStatus } from "../../hooks/useAdminPayouts";

export function AdminPayouts() {
  const { payouts, loading, updatePayoutStatus } = useAdminPayouts();
  const [filter, setFilter] = useState<"All" | PayoutStatus>("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const selected = payouts.find((payout) => payout.id === selectedId);
  const visiblePayouts = payouts.filter(
    (payout) =>
      (filter === "All" || payout.status === filter) &&
      `${payout.seller} ${payout.id}`.toLowerCase().includes(search.toLowerCase())
  );
  const pendingTotal = payouts
    .filter((payout) => payout.status === "Pending")
    .reduce((sum, payout) => sum + payout.amount, 0);

  const updateStatus = async (status: PayoutStatus) => {
    if (!selected) return;

    try {
      await updatePayoutStatus(selected.id, status);
      setNotice(`${selected.id} for ${selected.seller} was marked ${status.toLowerCase()}.`);
      setSelectedId(null);
    } catch (err: any) {
      setNotice(err.message || 'Failed to update payout status');
    }
  };

  const exportPayouts = () => {
    const rows = [
      "Payout,Seller,Amount,Requested,Bank,Status,Risk",
      ...payouts.map(
        (payout) =>
          `${payout.id},${payout.seller},${payout.amount},${payout.requested},${payout.bank},${payout.status},${payout.risk}`
      ),
    ];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "the-antiques-seller-payouts.csv";
    link.click();
    URL.revokeObjectURL(url);
    setNotice("The payout report has been downloaded.");
  };

  return (
    <main className="inner-page admin-payout-page">
      <div className="dashboard-title">
        <div>
          <span className="eyebrow">Admin finance desk</span>
          <h1>Seller payouts</h1>
          <p>Review withdrawal requests, verify account risk, and release seller funds.</p>
        </div>
        <button className="button outline" onClick={exportPayouts}>
          <Icon name="download" size={17} /> Export report
        </button>
      </div>

      {notice && (
        <div className="wallet-notice">
          <Icon name="check" size={17} />
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      <div className="admin-payout-stats">
        <div className="admin-payout-hero">
          <span>
            <Icon name="clock" size={18} /> Awaiting review
          </span>
          <strong>{money(pendingTotal)}</strong>
          <p>{payouts.filter((payout) => payout.status === "Pending").length} requests require a decision</p>
        </div>
        <div>
          <small>Approved today</small>
          <strong>{money(payouts.filter((payout) => payout.status === "Approved").reduce((sum, p) => sum + p.amount, 0))}</strong>
          <span>{payouts.filter((payout) => payout.status === "Approved").length} payout released</span>
        </div>
        <div>
          <small>On hold</small>
          <strong>{money(payouts.filter((payout) => payout.status === "On hold").reduce((sum, p) => sum + p.amount, 0))}</strong>
          <span>Identity review needed</span>
        </div>
        <div>
          <small>7-day volume</small>
          <strong>{money(payouts.reduce((sum, p) => sum + p.amount, 0))}</strong>
          <span>Across {payouts.length} payouts</span>
        </div>
      </div>

      <section className="table-card admin-payout-card">
        <div className="table-tools admin-payout-tools">
          <div className="tab-buttons">
            {(["All", "Pending", "Approved", "On hold", "Rejected"] as const).map((status) => (
              <button
                key={status}
                className={filter === status ? "active" : ""}
                onClick={() => setFilter(status)}
              >
                {status}
                {status === "Pending" && ` ${payouts.filter((payout) => payout.status === "Pending").length}`}
              </button>
            ))}
          </div>
          <label className="search-field">
            <Icon name="search" size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search seller or payout ID"
            />
          </label>
        </div>

        <div className="admin-payout-table">
          <div className="admin-payout-row admin-payout-head">
            <span>Seller</span>
            <span>Requested</span>
            <span>Risk</span>
            <span>Status</span>
            <span>Amount</span>
            <span></span>
          </div>
          {loading ? (
            <div className="admin-payout-row"><span>Loading payouts...</span></div>
          ) : visiblePayouts.length === 0 ? (
            <div className="admin-payout-empty">No payout requests match this view.</div>
          ) : (
            visiblePayouts.map((payout) => (
              <div className="admin-payout-row" key={payout.id}>
                <div className="admin-seller">
                  <span>{payout.initials}</span>
                  <div>
                    <strong>{payout.seller}</strong>
                    <small>{payout.id}</small>
                  </div>
                </div>
                <span>{payout.requested}</span>
                <span className={`risk-label ${payout.risk.toLowerCase()}`}>
                  {payout.risk === "High" && <Icon name="alert" size={12} />}
                  {payout.risk}
                </span>
                <span>
                  <i className={`wallet-status ${payout.status.toLowerCase().replace(" ", "-")}`}>
                    {payout.status}
                  </i>
                </span>
                <b>{money(payout.amount)}</b>
                <button onClick={() => setSelectedId(payout.id)}>
                  Review <Icon name="chevron" size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelectedId(null)}>
          <div className="modal admin-review-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedId(null)} aria-label="Close">
              <Icon name="close" />
            </button>
            <span className="eyebrow">Payout review · {selected.id}</span>
            <h2>{selected.seller}</h2>
            <div className="review-amount">
              <small>Requested amount</small>
              <strong>{money(selected.amount)}</strong>
              <span>
                <i className={`wallet-status ${selected.status.toLowerCase().replace(" ", "-")}`}>
                  {selected.status}
                </i>
              </span>
            </div>
            <div className="review-grid">
              <div>
                <small>Destination</small>
                <strong>{selected.bank}</strong>
              </div>
              <div>
                <small>Requested</small>
                <strong>{selected.requested}</strong>
              </div>
              <div>
                <small>Account history</small>
                <strong>
                  {selected.sales} completed sales · {selected.accountAge}
                </strong>
              </div>
              <div>
                <small>Risk check</small>
                <strong className={`review-risk ${selected.risk.toLowerCase()}`}>
                  {selected.risk} risk
                </strong>
              </div>
            </div>
            <div className="review-checks">
              <span>
                <Icon name="check" size={15} /> Identity verified
              </span>
              <span>
                <Icon name="check" size={15} /> Bank account matched
              </span>
              <span>
                <Icon name="check" size={15} /> Available balance confirmed
              </span>
            </div>
            <label className="review-note">
              Internal note
              <textarea placeholder="Add context for the finance team..." />
            </label>
            <div className="admin-review-actions">
              <button className="button danger-outline" onClick={() => updateStatus("Rejected")}>
                Reject
              </button>
              <button className="button outline" onClick={() => updateStatus("On hold")}>
                Place on hold
              </button>
              <button className="button primary" onClick={() => updateStatus("Approved")}>
                <Icon name="check" size={16} /> Approve payout
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
