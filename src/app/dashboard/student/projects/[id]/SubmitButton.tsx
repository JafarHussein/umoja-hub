'use client';

interface ISubmitButtonProps {
  engagementId: string;
}

export default function SubmitButton({ engagementId }: ISubmitButtonProps) {
  async function handleSubmit() {
    const res = await fetch(`/api/education/projects/${engagementId}/submit`, {
      method: 'POST',
    });
    if (res.ok) {
      window.location.reload();
    } else {
      const data = (await res.json()) as { error?: string };
      alert(data.error ?? 'Submission failed. Ensure all 5 process documents are complete.');
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleSubmit()}
      className="px-6 py-3 bg-accent-green text-white font-body text-t4 rounded-sm hover:opacity-90 transition-all duration-150 min-h-[44px]"
    >
      Submit for Review
    </button>
  );
}
