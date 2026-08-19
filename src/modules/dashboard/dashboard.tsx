import AffiliateProductDashboardSection from "@/modules/affiliate-product/affiliateProductDashboardSection";
import CourseDashboardSection from "@/modules/course/courseDashboardSection";
import PdfCourseDashboardSection from "@/modules/pdf-course/pdfCourseDashboardSection";

function DashboardPage() {
  return (
    <section className="grid h-full min-h-0 gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,65fr)_minmax(22rem,20fr)] lg:gap-0 lg:p-8">
      <div className="grid h-full min-h-0 grid-rows-[3fr_2fr] gap-4 overflow-hidden rounded-2xl rounded-tr-none rounded-br-none border border-r-0 bg-white">
        <CourseDashboardSection />
        <AffiliateProductDashboardSection />
      </div>
      <PdfCourseDashboardSection />
    </section>
  );
}

export default DashboardPage;
