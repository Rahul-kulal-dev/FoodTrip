import { CUISINES } from '../../data/mockData';
import { CuisineCard } from './CuisineCard';

export const CuisineSection = () => {
  return (
    <section className="mb-5 mt-4 overflow-hidden">
      <div className="flex flex-row overflow-x-auto no-scrollbar gap-4 md:gap-0 pb-2 w-full snap-x justify-start md:justify-between items-start md:overflow-visible md:snap-none">
        {CUISINES.map((cuisine) => (
          <div key={cuisine.id} className="w-[90px] sm:w-[120px] md:w-[155px] shrink-0 snap-start flex justify-center">
            <CuisineCard cuisine={cuisine} />
          </div>
        ))}

      </div>
    </section>
  );
};
