'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

interface Props {
  items: { imageUrl: string; alt?: string }[];
}

export default function Slider({ items }: Props) {
  return (
    <div className="w-full h-[248px] relative rounded-xl overflow-hidden">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000 }}
        loop
        className="w-full h-full"
      >
        {items.map((item, index) => (
          <SwiperSlide key={index}>
            <div className="relative w-full h-[248px]">
              <Image
                src={item.imageUrl}
                alt={item.alt || `Slide ${index}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 66vw"
                priority={index === 0}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
