import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import EditQuoteForm from "../../../components/quotes/EditQuoteForm";
import { useQuotes } from "../../../hooks/Quotes/useQuotes";

const EditQuotes: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getQuote, updateQuote, loading } = useQuotes();

  const quoteId = Number(id);
  const [quote, setQuote] = React.useState<any | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancel = false;
    async function run() {
      try {
        if (Number.isFinite(quoteId)) {
          const q = await getQuote(quoteId);
          if (!cancel) setQuote(q ?? null);
        } else {
          if (!cancel) setErr("Invalid quote id.");
        }
      } catch (e: any) {
        if (!cancel) setErr(e?.message ?? "Failed to load quote");
      }
    }
    run();
    return () => {
      cancel = true;
    };
  }, [quoteId, getQuote]);

  if (loading && !quote) return <div className="p-5 text-gray-500">Loading…</div>;
  if (err) return <div className="p-5 text-gray-500">{err}</div>;
  if (!quote) return <div className="p-5 text-gray-500"></div>;

  return (
    <div className="px-5 pb-5">
      <EditQuoteForm
        quote={quote}
        ui={{
          rootPath: "/admin/quotes",
          rootLabel: "Quotes",
          title: " Quotation",
          subtitle: "Update customer, service, and pricing details",
        }}
        onSave={async (quoteId, payload) => {
          // Save booking-form snapshot back to quote as JSON
          await updateQuote(quoteId, { payload });
          navigate("/admin/quotes");
        }}
      />
    </div>
  );
};

export default EditQuotes;
