import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type HadithFaqItem = { q: string; a: string };

type Props = {
  title?: string;
  items: HadithFaqItem[];
  className?: string;
};

/** أسئلة مختصرة قابلة للفتح والإغلاق */
export function HadithFaq({ title = "أسئلة مختصرة", items, className = "" }: Props) {
  if (!items.length) return null;
  return (
    <section className={`hdl-faq ${className}`.trim()} aria-label={title}>
      <h3 className="hdl-faq__title">{title}</h3>
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, i) => (
          <AccordionItem key={item.q} value={`faq-${i}`} className="hdl-faq__item">
            <AccordionTrigger className="hdl-faq__trigger">{item.q}</AccordionTrigger>
            <AccordionContent className="hdl-faq__content">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
