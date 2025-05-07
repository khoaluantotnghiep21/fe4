'use client';
import { Carousel } from 'antd';
import Image from 'next/image';

interface CarouselItem {
  desktopSrc: string;
  mobileSrc: string;
  alt: string;
  desktopWidth: number;
  desktopHeight: number;
  mobileWidth: number;
  mobileHeight: number;
}

interface CarouselCustomProps {
  items: CarouselItem[];
  desktopWidth?: number;
  desktopHeight?: number;
  mobileWidth?: number;
  mobileHeight?: number;
}

const CarouselCustom: React.FC<CarouselCustomProps> = ({
  items = [],
  desktopWidth = 1920,
  desktopHeight = 600,
  mobileWidth = 768,
  mobileHeight = 300,
}) => {
  if (!items.length) {
    return <div className="text-center py-4">No items to display</div>;
  }

  return (
    <div>
      {/* Desktop */}
      <div className="hidden md:block">
        <Carousel arrows infinite autoplay autoplaySpeed={5000}>
          {items.map((item, index) => (
            <div key={index} className="w-full">
              <Image
                src={item.desktopSrc}
                alt={item.alt}
                width={desktopWidth}
                height={desktopHeight}
                sizes="100vw"
                className="w-full h-auto object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </Carousel>
      </div>

      {/* Mobile */}
      <div className="block md:hidden">
        <Carousel autoplay autoplaySpeed={3000}>
          {items.map((item, index) => (
            <div key={index} className="w-full">
              <Image
                src={item.mobileSrc}
                alt={item.alt}
                width={mobileWidth}
                height={mobileHeight}
                sizes="100vw"
                className="w-full h-auto object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  );
};

export default CarouselCustom;