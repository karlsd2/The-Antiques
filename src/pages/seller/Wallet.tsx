import { useState } from "react";
import { Icon } from "../../components/Icon";
import { Badge } from "../../components/Badge";
import { money } from "../../lib/utils";

const walletTransactions = [
  { id: "PAY-8024", date: "Jun 12, 2026", description: "Payout to bank ···· 4821", type: "Payout", amount: -1240, status: "Completed" },
  { id: "ORD-2048", date: "Jun 11, 2026", description: "Walnut Turntable", type: "Sale", amount: 256.5, status: "Available" },
  { id: "ORD-2031", date: "Jun 09, 2026", description: "Silver Stereo Receiver", type: "Sale", amount: 504, status: "Pending" },
  { id: "FEE-2031", date: "Jun 09, 2026", description: "Marketplace fee", type: "Fee", amount: -56, status: "Processed" },
  { id: "ORD-2017", date: "Jun 06, 2026", description: "Mechanical Watch", type: "Sale", amount: 378, status: "Available" },
  { id: "ORD-1998", date: "Jun 02, 2026", description: "35mm Rangefinder", type: "Sale", amount: 175.5, status: "Available" },
];

export function Wallet() {
  const [showPayout, setShowPayout] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [amount, setAmount] = useState("8420.50");
  const [notice, setNotice] = useState("");

  const requestPayout = (event: React.FormEvent) => {
    event.preventDefault();
    setShowPayout(false);
    setNotice(
      `Your $${Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} payout is on its way.`
    );
  };

  const downloadStatement = () => {
    const rows = [
      "Transaction,Date,Description,Type,Amount,Status",
      ...walletTransactions.map(
        (transaction) =>
          `${transaction.id},${transaction.date},${transaction.description},${transaction.type},${transaction.amount},${transaction.status}`
      ),
    ];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "the-antiques-wallet-june-2026.csv";
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Your June wallet statement has been downloaded.");
  };

  return (
    <main className="inner-page wallet-page">
      <div className="dashboard-title">
        <div>
          <span className="eyebrow">Seller finances</span>
          <h1>Your wallet</h1>
          <p>Track earnings, manage payouts, and review every transaction.</p>
        </div>
        <button className="button outline" onClick={downloadStatement}>
          <Icon name="download" size={17} /> Download statement
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

      <div className="wallet-overview">
        <section className="balance-card">
          <div className="balance-card-top">
            <span>
              <Icon name="wallet" /> Available balance
            </span>
            <small>USD</small>
          </div>
          <strong>$8,420.50</strong>
          <p>Ready to transfer to your connected bank account.</p>
          <button className="button wallet-button" onClick={() => setShowPayout(true)}>
            Withdraw funds <Icon name="arrow" size={17} />
          </button>
          <div className="balance-details">
            <span>
              <small>Pending balance</small>
              <b>$1,260.00</b>
            </span>
            <span>
              <small>Next automatic payout</small>
              <b>June 18</b>
            </span>
          </div>
        </section>

        <section className="wallet-side">
          <div className="bank-card">
            <div className="wallet-card-heading">
              <span>
                <Icon name="bank" size={20} /> Payout account
              </span>
              <button
                onClick={() =>
                  setNotice(
                    "Your verified payout account is selected. Bank changes require identity confirmation."
                  )
                }
              >
                Manage
              </button>
            </div>
            <div className="bank-account">
              <span>FF</span>
              <div>
                <strong>Bank of America</strong>
                <small>Checking account ending in 4821</small>
              </div>
              <Badge>Verified</Badge>
            </div>
            <p>Automatic payouts are sent every Wednesday.</p>
          </div>

          <div className="wallet-mini-grid">
            <div>
              <small>This month</small>
              <strong>$3,286</strong>
              <span>+12.4% from May</span>
            </div>
            <div>
              <small>Lifetime earnings</small>
              <strong>$42,840</strong>
              <span>Across 126 sales</span>
            </div>
          </div>
        </section>
      </div>

      <section className="table-card wallet-transactions">
        <div className="panel-heading">
          <div>
            <h2>Recent transactions</h2>
            <span>All wallet activity</span>
          </div>
          <button
            className="text-link"
            onClick={() => setShowAllTransactions((current) => !current)}
          >
            {showAllTransactions ? "Show recent" : "View all"}{" "}
            <Icon name="arrow" size={15} />
          </button>
        </div>

        <div className="wallet-table">
          <div className="wallet-row wallet-row-head">
            <span>Transaction</span>
            <span>Date</span>
            <span>Type</span>
            <span>Status</span>
            <span>Amount</span>
          </div>
          {walletTransactions
            .slice(0, showAllTransactions ? walletTransactions.length : 4)
            .map((transaction) => (
              <div className="wallet-row" key={transaction.id}>
                <div>
                  <strong>{transaction.description}</strong>
                  <small>{transaction.id}</small>
                </div>
                <span>{transaction.date}</span>
                <span>{transaction.type}</span>
                <span>
                  <i className={`wallet-status ${transaction.status.toLowerCase()}`}>
                    {transaction.status}
                  </i>
                </span>
                <b className={transaction.amount > 0 ? "positive" : ""}>
                  {transaction.amount > 0 ? "+" : "−"}
                  {money(Math.abs(transaction.amount))}
                </b>
              </div>
            ))}
        </div>
      </section>

      {showPayout && (
        <div className="modal-backdrop" onClick={() => setShowPayout(false)}>
          <div className="modal payout-modal" onClick={(event) => event.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowPayout(false)}
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
            <span className="eyebrow">Transfer funds</span>
            <h2>Withdraw your balance</h2>
            <p>Funds typically arrive in your bank account within 1–2 business days.</p>
            <form onSubmit={requestPayout}>
              <label className="payout-amount">
                Amount
                <span>
                  <b>$</b>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                    required
                  />
                </span>
              </label>
              <button
                type="button"
                className="payout-all"
                onClick={() => setAmount("8420.50")}
              >
                Withdraw full available balance
              </button>
              <div className="payout-destination">
                <Icon name="bank" />
                <span>
                  <small>Sending to</small>
                  <strong>Bank of America ···· 4821</strong>
                </span>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button outline"
                  onClick={() => setShowPayout(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button primary">
                  Confirm withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
