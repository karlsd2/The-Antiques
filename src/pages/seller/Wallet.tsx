import { useState } from "react";
import { Icon } from "../../components/Icon";
import { Badge } from "../../components/Badge";
import { SkeletonStat, SkeletonText } from "../../components/Skeleton";
import { money } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
import { useWallet } from "../../hooks/useWallet";
import { supabase } from "../../lib/supabase";

export function Wallet() {
  const { user } = useAuth();
  const { balance, transactions, payoutAccount, loading, requestPayout: requestPayoutApi, refetch } = useWallet(user?.id || null);
  const [showPayout, setShowPayout] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [amount, setAmount] = useState(balance?.available_balance?.toFixed(2) || "0.00");
  const [notice, setNotice] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [accountType, setAccountType] = useState<'bank' | 'gcash'>('bank');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');

  const handleRequestPayout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!balance) return;

    try {
      setIsProcessing(true);
      const payoutAmount = Number(amount || 0);
      await requestPayoutApi(payoutAmount);
      setShowPayout(false);
      setNotice(
        `Your ₱${payoutAmount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} payout is on its way.`
      );
      setAmount(balance.available_balance.toFixed(2));
    } catch (err: any) {
      setNotice(err.message || 'Failed to request payout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id) return;

    try {
      setIsProcessing(true);
      const accountData: any = {
        seller_id: user.id,
        account_type: accountType,
        is_verified: false,
        is_default: true,
      };

      if (accountType === 'bank') {
        accountData.bank_name = bankName;
        accountData.account_number_last4 = accountNumber.slice(-4);
        accountData.account_holder_name = accountHolderName;
      } else {
        accountData.bank_name = 'GCash';
        accountData.account_number_last4 = gcashNumber.slice(-4);
        accountData.account_holder_name = accountHolderName;
      }

      const { error } = await supabase.from('payout_accounts').insert(accountData);

      if (error) throw error;

      setShowAddAccount(false);
      setNotice('Payout account added successfully.');
      setAccountType('bank');
      setBankName('');
      setAccountNumber('');
      setAccountHolderName('');
      setGcashNumber('');
      refetch();
    } catch (err: any) {
      setNotice(err.message || 'Failed to add payout account. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadStatement = () => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const rows = [
      "Transaction,Date,Description,Type,Amount,Status",
      ...transactions.map(
        (transaction) =>
          `${transaction.transaction_id},${new Date(transaction.created_at).toLocaleDateString()},${transaction.description},${transaction.type},${transaction.amount},${transaction.status}`
      ),
    ];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `the-antiques-wallet-${currentMonth.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Your ${currentMonth} wallet statement has been downloaded.`);
  };

  return (
    <main className="inner-page wallet-page">
      <div className="dashboard-title">
        <div>
          <span className="eyebrow">Seller finances</span>
          <h1>Your wallet</h1>
          <p>Track earnings, manage payouts, and review every transaction.</p>
        </div>
        <button className="button outline" onClick={downloadStatement} disabled={loading || transactions.length === 0}>
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
        {loading ? (
          <>
            <section className="balance-card skeleton-stat">
              <div className="skeleton-text" style={{ height: '10px', width: '40%', marginBottom: '15px' }} />
              <div className="skeleton-text" style={{ height: '42px', width: '60%', marginBottom: '10px' }} />
              <div className="skeleton-text" style={{ height: '10px', width: '80%', marginBottom: '20px' }} />
              <div className="skeleton-text" style={{ height: '35px', width: '100%', marginBottom: '20px' }} />
              <div className="balance-details">
                <div>
                  <div className="skeleton-text" style={{ height: '8px', width: '40%', marginBottom: '5px' }} />
                  <div className="skeleton-text" style={{ height: '16px', width: '60%' }} />
                </div>
                <div>
                  <div className="skeleton-text" style={{ height: '8px', width: '40%', marginBottom: '5px' }} />
                  <div className="skeleton-text" style={{ height: '16px', width: '60%' }} />
                </div>
              </div>
            </section>
            <section className="wallet-side">
              <div className="bank-card skeleton-stat">
                <div className="skeleton-text" style={{ height: '10px', width: '50%', marginBottom: '15px' }} />
                <div className="skeleton-text" style={{ height: '16px', width: '30%', marginBottom: '10px' }} />
                <div className="skeleton-text" style={{ height: '10px', width: '80%', marginBottom: '5px' }} />
                <div className="skeleton-text" style={{ height: '8px', width: '60%' }} />
              </div>
              <div className="wallet-mini-grid">
                <div className="skeleton-stat">
                  <div className="skeleton-text" style={{ height: '8px', width: '40%', marginBottom: '8px' }} />
                  <div className="skeleton-text" style={{ height: '20px', width: '60%', marginBottom: '5px' }} />
                  <div className="skeleton-text" style={{ height: '8px', width: '50%' }} />
                </div>
                <div className="skeleton-stat">
                  <div className="skeleton-text" style={{ height: '8px', width: '40%', marginBottom: '8px' }} />
                  <div className="skeleton-text" style={{ height: '20px', width: '60%', marginBottom: '5px' }} />
                  <div className="skeleton-text" style={{ height: '8px', width: '50%' }} />
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="balance-card">
              <div className="balance-card-top">
                <span>
                  <Icon name="wallet" /> Available balance
                </span>
                <small>USD</small>
              </div>
              <strong>{money(balance?.available_balance || 0)}</strong>
              <p>Ready to transfer to your connected bank account.</p>
              <button className="button wallet-button" onClick={() => setShowPayout(true)} disabled={loading || (balance?.available_balance || 0) === 0}>
                Withdraw funds <Icon name="arrow" size={17} />
              </button>
              <div className="balance-details">
                <span>
                  <small>Pending balance</small>
                  <b>{money(balance?.pending_balance || 0)}</b>
                </span>
                <span>
                  <small>Next automatic payout</small>
                  <b>Every Wednesday</b>
                </span>
              </div>
            </section>

            <section className="wallet-side">
              <div className="bank-card">
                <div className="wallet-card-heading">
                  <span>
                    <Icon name="bank" size={20} /> Payout account
                  </span>
                  {payoutAccount ? (
                    <button
                      onClick={() =>
                        setNotice(
                          "Your verified payout account is selected. Bank changes require identity confirmation."
                        )
                      }
                    >
                      Manage
                    </button>
                  ) : (
                    <button className="button primary" onClick={() => setShowAddAccount(true)}>
                      Add account
                    </button>
                  )}
                </div>
                <div className="bank-account">
                  <span>{payoutAccount?.bank_name?.substring(0, 2).toUpperCase() || payoutAccount?.account_type?.substring(0, 2).toUpperCase() || 'NA'}</span>
                  <div>
                    <strong>{payoutAccount?.bank_name || payoutAccount?.account_type || 'No account configured'}</strong>
                    <small>{payoutAccount?.account_number_last4 ? `${payoutAccount.account_type === 'gcash' ? 'GCash' : 'Account'} ending in ${payoutAccount.account_number_last4}` : 'Add a payout account'}</small>
                  </div>
                  {payoutAccount?.is_verified && <Badge>Verified</Badge>}
                </div>
                <p>{payoutAccount ? 'Automatic payouts are sent every Wednesday.' : 'Configure a payout account to receive funds.'}</p>
              </div>

              <div className="wallet-mini-grid">
                <div>
                  <small>This month</small>
                  <strong>{money(transactions
                    .filter(t => t.type === 'Sale' && new Date(t.created_at).getMonth() === new Date().getMonth())
                    .reduce((sum, t) => sum + t.amount, 0))}</strong>
                  <span>{transactions.filter(t => t.type === 'Sale' && new Date(t.created_at).getMonth() === new Date().getMonth()).length} sales this month</span>
                </div>
                <div>
                  <small>Lifetime earnings</small>
                  <strong>{money(balance?.lifetime_earnings || 0)}</strong>
                  <span>Across {transactions.filter(t => t.type === 'Sale').length} sales</span>
                </div>
              </div>
            </section>
          </>
        )}
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
          {loading ? (
            <div className="wallet-row"><SkeletonText lines={4} /></div>
          ) : transactions.length === 0 ? (
            <div className="wallet-row"><span>No transactions yet. Transactions will appear when orders are delivered.</span></div>
          ) : (
            transactions
              .slice(0, showAllTransactions ? transactions.length : 4)
              .map((transaction) => (
                <div className="wallet-row" key={transaction.id}>
                  <div>
                    <strong>{transaction.description}</strong>
                    <small>{transaction.transaction_id}</small>
                  </div>
                  <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
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
              ))
          )}
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
            <form onSubmit={handleRequestPayout}>
              <label className="payout-amount">
                Amount
                <span>
                  <b>₱</b>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                    required
                    max={balance?.available_balance || 0}
                  />
                </span>
              </label>
              <button
                type="button"
                className="payout-all"
                onClick={() => setAmount(balance?.available_balance?.toFixed(2) || "0.00")}
              >
                Withdraw full available balance
              </button>
              <div className="payout-destination">
                <Icon name="bank" />
                <span>
                  <small>Sending to</small>
                  <strong>{payoutAccount?.bank_name || payoutAccount?.account_type || 'No account'} ···· {payoutAccount?.account_number_last4 || 'N/A'}</strong>
                </span>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button outline"
                  onClick={() => setShowPayout(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button type="submit" className="button primary" disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Confirm withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddAccount && (
        <div className="modal-backdrop" onClick={() => setShowAddAccount(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowAddAccount(false)}
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
            <span className="eyebrow">Payout account</span>
            <h2>Add payout account</h2>
            <p>Configure where you want to receive your earnings.</p>
            <form onSubmit={handleAddAccount}>
              <label>
                Account type
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as 'bank' | 'gcash')}
                  required
                >
                  <option value="bank">Bank account</option>
                  <option value="gcash">GCash</option>
                </select>
              </label>
              <label>
                Account holder name
                <input
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  required
                  placeholder="Full name on account"
                />
              </label>
              {accountType === 'bank' ? (
                <>
                  <label>
                    Bank name
                    <input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      required
                      placeholder="e.g., BDO, BPI, Metrobank"
                    />
                  </label>
                  <label>
                    Account number
                    <input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      required
                      placeholder="Enter account number"
                      minLength={10}
                    />
                  </label>
                </>
              ) : (
                <label>
                  GCash number
                  <input
                    value={gcashNumber}
                    onChange={(e) => setGcashNumber(e.target.value)}
                    required
                    placeholder="09XXXXXXXXX"
                    pattern="[0-9]{11}"
                    maxLength={11}
                  />
                </label>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="button outline"
                  onClick={() => setShowAddAccount(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button type="submit" className="button primary" disabled={isProcessing}>
                  {isProcessing ? 'Adding...' : 'Add account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
