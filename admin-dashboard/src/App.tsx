import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  limit,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions, configured } from "./firebase";
import "./style.css";

type Row = { id: string; [key: string]: any };
type Page = "Overview" | "Orders" | "Dealers" | "Service desk";
const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
const date = (value: any) =>
  value?.toDate
    ? value
        .toDate()
        .toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
    : "—";
const transitions: Record<string, string[]> = {
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};
const serviceTransitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["assigned", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};
const readable = (s: string) => s?.replaceAll("_", " ") || "—";
function Badge({ status }: { status: string }) {
  return <span className={`badge ${status}`}>{readable(status)}</span>;
}

export default function App() {
  const [session, setSession] = useState<
    "loading" | "login" | "admin" | "denied"
  >("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>("Overview");
  const [orders, setOrders] = useState<Row[]>([]);
  const [dealers, setDealers] = useState<Row[]>([]);
  const [services, setServices] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Row | null>(null);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [technician, setTechnician] = useState("");
  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        setError("");
        if (!user) {
          setSession("login");
          return;
        }
        try {
          const profile = await getDoc(doc(db, "users", user.uid));
          setSession(profile.data()?.role === "admin" ? "admin" : "denied");
        } catch (e) {
          setSession("denied");
          setError((e as Error).message);
        }
      }),
    [],
  );
  useEffect(() => {
    if (session !== "admin") {
      setOrders([]);
      setDealers([]);
      setServices([]);
      return;
    }
    setLoading(true);
    let count = 0;
    return (() => {
      const stop = [
        ["orders", setOrders],
        ["dealerApplications", setDealers],
        ["serviceBookings", setServices],
      ].map(([name, setter]) =>
        onSnapshot(
          query(
            collection(db, name as string),
            orderBy("createdAt", "desc"),
            limit(500),
          ),
          (snapshot) => {
            (setter as (rows: Row[]) => void)(
              snapshot.docs.map((d) => ({ ...d.data(), id: d.id })),
            );
            if (++count >= 3) setLoading(false);
          },
          (e) => {
            setError(e.message);
            setLoading(false);
          },
        ),
      );
      return () => stop.forEach((fn) => fn());
    })();
  }, [session]);
  async function login(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setError(
        "Unable to sign in. Check your credentials and Firebase configuration.",
      );
    } finally {
      setBusy(false);
    }
  }
  function navigate(next: Page) {
    setPage(next);
    setSearch("");
    setFilter("all");
    setSelected(null);
    setMessage("");
  }
  function select(row: Row) {
    setSelected(row);
    setStatus("");
    setNote("");
    setTechnician(row.assignedTechnician || "");
    setMessage("");
  }
  async function mutate(name: string, payload: object) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await httpsCallable(functions, name)(payload);
      setMessage("Changes saved. The customer notification is queued.");
      setSelected(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const rows =
    page === "Dealers" ? dealers : page === "Service desk" ? services : orders;
  const shown = rows.filter(
    (row) =>
      (filter === "all" || row.status === filter || row.userType === filter) &&
      [
        row.id,
        row.userId,
        row.businessName,
        row.contactName,
        row.serviceType,
        row.status,
        row.deliveryAddress?.fullName,
      ].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
  );
  const pending = services.filter(
    (r) => !["completed", "cancelled"].includes(r.status),
  ).length;
  const applications = dealers.filter((r) => r.status === "pending").length;
  const revenue = orders
    .filter((r) => r.paymentStatus === "paid")
    .reduce((s, r) => s + r.totalAmount, 0);
  if (session === "loading")
    return (
      <main className="auth">
        <p role="status">Checking your session…</p>
      </main>
    );
  if (session !== "admin")
    return (
      <main className="auth">
        <section className="auth-story">
          <div className="wordmark">
            ◈ AquaPure<span>OPERATIONS</span>
          </div>
          <h1>
            Better water.
            <br />
            Better service.
          </h1>
          <p>One workspace for every order, dealer and service request.</p>
          <div className="water-orbit">◈</div>
        </section>
        <section className="auth-form">
          <span className="eyebrow">AQUAPURE / ADMIN</span>
          <h2>{session === "denied" ? "Access restricted" : "Welcome back"}</h2>
          <p className="muted">
            {session === "denied"
              ? "This account does not have administrator access."
              : "Sign in to manage your water solutions business."}
          </p>
          {!configured && (
            <p className="notice">
              Add Firebase configuration to .env.local to connect this
              dashboard.
            </p>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {session === "login" ? (
            <form onSubmit={login}>
              <label>
                Email address
                <input
                  required
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@yourbusiness.com"
                />
              </label>
              <label>
                Password
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button disabled={busy || !configured}>
                {busy ? "Signing in…" : "Sign in →"}
              </button>
            </form>
          ) : (
            <button onClick={() => signOut(auth)}>Use another account</button>
          )}
          <small>
            Administrator access is provisioned by the project owner.
          </small>
        </section>
      </main>
    );
  return (
    <div className="shell">
      <aside>
        <div className="wordmark">
          ◈ AquaPure<span>OPERATIONS</span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {(["Overview", "Orders", "Dealers", "Service desk"] as Page[]).map(
            (item, i) => (
              <button
                key={item}
                className={page === item ? "active" : ""}
                onClick={() => navigate(item)}
              >
                <span>{["◫", "▣", "◇", "⚒"][i]}</span>
                {item}
                {item === "Dealers" && applications > 0 && (
                  <b>{applications}</b>
                )}
              </button>
            ),
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="health">
            <i /> Firebase connected
          </div>
          <button onClick={() => signOut(auth)}>Sign out ↗</button>
        </div>
      </aside>
      <div className="workspace">
        <header>
          <span>
            AquaPure <span className="muted">/ {page}</span>
          </span>
          <div className="admin-chip">
            <span>AD</span> Administrator
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <span className="eyebrow">BUSINESS OPERATIONS</span>
              <h1>
                {page === "Overview" ? "Your business, at a glance." : page}
              </h1>
              <p className="muted">
                {page === "Overview"
                  ? "Keep orders moving and customers taken care of."
                  : "Live records from your Firebase project."}
              </p>
            </div>
            <span className="today">
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="success" role="status">
              {message}
            </p>
          )}
          {loading && <p role="status">Loading workspace…</p>}
          {page === "Overview" && (
            <>
              <section className="metrics">
                {[
                  ["Captured order value", money(revenue), "Payment captured"],
                  ["Total orders", orders.length, "Customer + dealer"],
                  ["Open services", pending, "Awaiting completion"],
                  ["Dealer applications", applications, "Awaiting approval"],
                ].map(([label, value, caption]) => (
                  <article key={label}>
                    <p>{label}</p>
                    <strong>{value}</strong>
                    <small>{caption}</small>
                  </article>
                ))}
              </section>
              <section className="overview-grid">
                <article className="panel">
                  <div className="panel-title">
                    <h2>Order pipeline</h2>
                    <span className="muted">Current status</span>
                  </div>
                  {[
                    "confirmed",
                    "processing",
                    "shipped",
                    "out_for_delivery",
                    "delivered",
                  ].map((s) => (
                    <div className="pipeline" key={s}>
                      <span>{readable(s)}</span>
                      <div>
                        <i
                          style={{
                            width: `${orders.length ? (orders.filter((r) => r.status === s).length / orders.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <b>{orders.filter((r) => r.status === s).length}</b>
                    </div>
                  ))}
                </article>
                <article className="callout">
                  <span className="eyebrow">NEEDS YOUR ATTENTION</span>
                  <h2>
                    Great service starts
                    <br />
                    with a quick response.
                  </h2>
                  <p>
                    {pending} open service requests and {applications} dealer
                    applications.
                  </p>
                  <button onClick={() => navigate("Service desk")}>
                    Open service desk →
                  </button>
                </article>
              </section>
            </>
          )}
          <section className="panel">
            <div className="panel-title">
              <h2>
                {page === "Overview"
                  ? "Recent orders"
                  : page === "Dealers"
                    ? "Dealer applications"
                    : page === "Service desk"
                      ? "Service requests"
                      : "All orders"}
              </h2>
              <span className="muted">{shown.length} records</span>
            </div>
            <div className="toolbar">
              <input
                aria-label="Search records"
                placeholder="Search name, ID or status…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                aria-label="Filter records"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All records</option>
                {(page === "Dealers"
                  ? ["pending", "approved", "rejected"]
                  : page === "Service desk"
                    ? [
                        "pending",
                        "confirmed",
                        "assigned",
                        "in_progress",
                        "completed",
                        "cancelled",
                      ]
                    : [
                        "customer",
                        "dealer",
                        "confirmed",
                        "processing",
                        "shipped",
                        "out_for_delivery",
                        "delivered",
                        "cancelled",
                      ]
                ).map((s) => (
                  <option key={s} value={s}>
                    {readable(s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      {page === "Dealers"
                        ? "Business"
                        : page === "Service desk"
                          ? "Service"
                          : "Order"}
                    </th>
                    <th>{page === "Dealers" ? "Applicant" : "Customer"}</th>
                    <th>
                      {page === "Dealers"
                        ? "Location"
                        : page === "Service desk"
                          ? "Preferred date"
                          : "Amount"}
                    </th>
                    <th>Status</th>
                    <th>Created</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.slice(0, page === "Overview" ? 8 : 500).map((row) => (
                    <tr key={row.id}>
                      <td>
                        <b>
                          {page === "Dealers"
                            ? row.businessName
                            : page === "Service desk"
                              ? readable(row.serviceType)
                              : `#${row.id.slice(-10)}`}
                        </b>
                        <small>
                          {page === "Service desk"
                            ? row.contactPhone
                            : row.userType || row.businessType}
                        </small>
                      </td>
                      <td>
                        {row.deliveryAddress?.fullName ||
                          row.contactName ||
                          row.email ||
                          row.userId?.slice(0, 12)}
                      </td>
                      <td>
                        {page === "Dealers"
                          ? row.city
                          : page === "Service desk"
                            ? date(row.preferredDate)
                            : money(row.totalAmount)}
                      </td>
                      <td>
                        <Badge status={row.status} />
                      </td>
                      <td>{date(row.createdAt)}</td>
                      <td>
                        <button
                          className="text-button"
                          onClick={() => select(row)}
                          aria-label={`View ${row.id}`}
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && !shown.length && (
                <div className="empty">
                  <span>◇</span>
                  <h3>No records here yet</h3>
                  <p>
                    New activity will appear here automatically. Try changing
                    your search or filter.
                  </p>
                </div>
              )}
            </div>
            <p className="table-note">
              Showing up to 500 most recent records per collection. Overview
              totals cover these loaded records.
            </p>
          </section>
        </main>
      </div>
      {selected && (
        <div
          className="modal-backdrop"
          onClick={() => !busy && setSelected(null)}
        >
          <section
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              aria-label="Close details"
              disabled={busy}
              onClick={() => setSelected(null)}
            >
              ×
            </button>
            <span className="eyebrow">RECORD DETAILS</span>
            <h2 id="detail-title">
              {selected.businessName ||
                selected.serviceType ||
                `Order #${selected.id.slice(-10)}`}
            </h2>
            <Badge status={selected.status} />
            <p className="muted">{selected.id}</p>
            {selected.deliveryAddress && (
              <section>
                <h3>Delivery</h3>
                <p>
                  {selected.deliveryAddress.fullName}
                  <br />
                  {selected.deliveryAddress.street}
                  <br />
                  {selected.deliveryAddress.city},{" "}
                  {selected.deliveryAddress.state}{" "}
                  {selected.deliveryAddress.pincode}
                  <br />
                  {selected.deliveryAddress.phone}
                </p>
              </section>
            )}
            {selected.address && (
              <section>
                <h3>Address</h3>
                <p>
                  {typeof selected.address === "string"
                    ? selected.address
                    : [
                        selected.address.street,
                        selected.address.city,
                        selected.address.pincode,
                      ].join(", ")}
                </p>
              </section>
            )}
            {selected.items?.map((i: any) => (
              <div className="detail-item" key={i.productId}>
                <span>
                  {i.quantity} × {i.name}
                </span>
                <b>{money(i.price * i.quantity)}</b>
              </div>
            ))}
            {selected.totalAmount && (
              <h3>
                Total {money(selected.totalAmount)} · {selected.paymentStatus}
              </h3>
            )}
            {selected.razorpayPaymentId && (
              <p>Payment: {selected.razorpayPaymentId}</p>
            )}
            {selected.preferredTime && (
              <p>
                {date(selected.preferredDate)} · {selected.preferredTime}
                <br />
                {selected.purifierDetails}
              </p>
            )}
            {selected.statusHistory?.map((h: any, i: number) => (
              <p key={i}>
                <Badge status={h.status} /> {h.note}{" "}
                <small>{date(h.updatedAt)}</small>
              </p>
            ))}
            {page === "Dealers" ? (
              <>
                {selected.status !== "pending" && (
                  <>
                    <label>
                      Access change reason
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </label>
                    <button
                      disabled={busy || !note.trim()}
                      onClick={() =>
                        mutate("setDealerAccess", {
                          applicationId: selected.id,
                          enabled: selected.status !== "approved",
                          note,
                        })
                      }
                    >
                      {selected.status === "approved"
                        ? "Disable wholesale access"
                        : "Restore wholesale access"}
                    </button>
                  </>
                )}
                {selected.status === "pending" && (
                  <>
                    <label>
                      Review note
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </label>
                    <div className="actions">
                      <button
                        disabled={busy}
                        onClick={() =>
                          mutate("approveDealer", {
                            applicationId: selected.id,
                          })
                        }
                      >
                        Approve dealer
                      </button>
                      <button
                        className="secondary"
                        disabled={busy || !note.trim()}
                        onClick={() =>
                          mutate("rejectDealer", {
                            applicationId: selected.id,
                            reason: note,
                          })
                        }
                      >
                        Reject application
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  mutate(
                    page === "Service desk"
                      ? "updateServiceStatus"
                      : "updateOrderStatus",
                    {
                      [page === "Service desk" ? "bookingId" : "orderId"]:
                        selected.id,
                      status,
                      note,
                      assignedTechnician: technician,
                    },
                  );
                }}
              >
                <label>
                  Next status
                  <select
                    required
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">Select status</option>
                    {(page === "Service desk"
                      ? serviceTransitions
                      : transitions)[selected.status]?.map((s) => (
                      <option key={s} value={s}>
                        {readable(s)}
                      </option>
                    ))}
                  </select>
                </label>
                {page === "Service desk" && (
                  <label>
                    Assigned technician
                    <input
                      value={technician}
                      required={status === "assigned"}
                      onChange={(e) => setTechnician(e.target.value)}
                    />
                  </label>
                )}
                <label>
                  Internal / status note
                  <textarea
                    value={note}
                    maxLength={2000}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
                {status === "cancelled" && (
                  <p className="notice">
                    Captured payments require a separate refund in Razorpay.
                    This action does not issue a refund.
                  </p>
                )}
                <button disabled={busy || !status}>
                  {busy ? "Saving…" : "Save status update"}
                </button>
              </form>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
