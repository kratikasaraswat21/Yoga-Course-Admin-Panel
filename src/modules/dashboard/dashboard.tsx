import PdfCourseDashboardSection from "@/modules/pdf-course/pdfCourseDashboardSection";

function DashboardPage() {
  return (
    <section className="grid h-full lg:grid-cols-[minmax(0,65fr)_minmax(22rem,20fr)] p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-center rounded-2xl rounded-tr-none rounded-br-none border p-8 text-white lg:min-h-0 bg-white border-r-0">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-black">Dashboard screen</h2>
        </div>
      </div>
      <PdfCourseDashboardSection />
    </section>
  );
}

export default DashboardPage;
