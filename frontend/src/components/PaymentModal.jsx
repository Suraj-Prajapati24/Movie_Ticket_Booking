import { useEffect, useRef, useState } from "react";

const CURRENCY = "₹";

export default function PaymentModal({
  seatLabels,
  pricePerSeat,
  onPay,
  onClose,
  onSuccess,
}) {
  const [stage, setStage] = useState("review");
  const [errorText, setErrorText] = useState("");
  const [bookingId, setBookingId] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const timers = useRef([]);

  const amount = seatLabels.length * pricePerSeat;

  useEffect(() => () => timers.current.forEach(clearTimeout), []); // Clear any pending timers.

  // Close on Escape (only when not mid-payment).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && (stage === "review" || stage === "error"))
        onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, onClose]);

  const handlePay = async () => {
    setStage("processing");
    setErrorText("");
    await new Promise((r) => {
      const t = setTimeout(r, 1600);
      timers.current.push(t);
    });

    let result;
    try {
      result = await onPay();
    } catch {
      result = { ok: false, message: "Could not reach the server." };
    }

    if (result.ok) {
      setBookingId(result.bookingId);
      setStage("success");
      [3, 2, 1].forEach((n, i) => {
        const t = setTimeout(
          () => setCountdown(n - 1 >= 0 ? n - 1 : 0),
          (i + 1) * 1000,
        );
        timers.current.push(t);
      });
      const done = setTimeout(() => onSuccess(result.bookingId), 3000);
      timers.current.push(done);
    } else {
      setErrorText(result.message || "Payment failed. Please try again.");
      setStage("error");
    }
  };

  const handleBackdrop = () => {
    if (stage === "review" || stage === "error") onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {stage === "review" && (
          <>
            <h3 className="modal-title">Confirm &amp; Pay</h3>
            <div className="receipt">
              <div className="receipt-row">
                <span>Seats</span>
                <span>{seatLabels.join(", ")}</span>
              </div>
              <div className="receipt-row">
                <span>
                  {seatLabels.length} × {CURRENCY}
                  {pricePerSeat}
                </span>
                <span>
                  {CURRENCY}
                  {amount}
                </span>
              </div>
              <div className="receipt-row receipt-total">
                <span>Total</span>
                <span>
                  {CURRENCY}
                  {amount}
                </span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handlePay}>
                Pay {CURRENCY}
                {amount}
              </button>
            </div>
            <p className="modal-note">
              Demo payment — no real card is charged.
            </p>
          </>
        )}

        {stage === "processing" && (
          <div className="modal-center">
            <div className="spinner" />
            <p className="modal-status">Processing payment…</p>
            <p className="modal-note">Please don’t close this window.</p>
          </div>
        )}

        {stage === "success" && (
          <div className="modal-center">
            <div className="success-check">✓</div>
            <p className="modal-status">Payment successful!</p>
            <p className="modal-note">
              Booking #{bookingId} confirmed · {seatLabels.length} seat
              {seatLabels.length > 1 ? "s" : ""}
            </p>
            <p className="modal-note">Closing in {countdown}s…</p>
          </div>
        )}

        {stage === "error" && (
          <div className="modal-center">
            <div className="error-cross">!</div>
            <p className="modal-status">Payment failed</p>
            <p className="modal-note">{errorText}</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
              <button className="btn btn-primary" onClick={handlePay}>
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
