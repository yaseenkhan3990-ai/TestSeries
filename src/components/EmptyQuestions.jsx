export default function EmptyQuestions() {
  return (
    <div className="rounded-md border border-dashed border-[#b8c7d3] bg-[#f8fbfd] p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#e9fbf4] text-xl font-black text-[#08bd80]">
        Q
      </div>
      <p className="mt-4 text-lg font-black text-[#172b4d]">No questions loaded</p>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-[#5f6c7b]">
        Upload a PDF and the AI will analyze its language, context, and topics to create objective questions.
      </p>
    </div>
  )
}
