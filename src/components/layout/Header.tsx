// src/components/layout/Header.tsx

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, ChangeEvent } from 'react';
import { Input, Button, Menu, Drawer, Popover, QRCode, Badge, Dropdown } from 'antd';
import {
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  MenuOutlined,
  CloseOutlined,
  PhoneFilled,
  MobileFilled,
  DownOutlined,
} from '@ant-design/icons';
import { useCartStore } from '@/store/cartStore';
import type { MenuProps } from 'antd';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

interface CustomMenuItem {
  key: string;
  label: React.ReactNode;
  children?: Array<CustomMenuItem | { type: 'group'; label: string; children: CustomMenuItem[] }>;
}

const items: CustomMenuItem[] = [
  {
    key: 'home',
    label: <Link href='/'>Thực phẩm chức năng</Link>,
    children: [
      {
        type: 'group',
        label: 'Dinh dưỡng',
        children: [
          { key: 'home_1', label: <Link href='/products?type=vitamin'>Vitamin & Khoáng chất</Link> },
          { key: 'home_2', label: <Link href='/products?type=supplement'>Thực phẩm bổ sung</Link> },
        ],
      },
      {
        type: 'group',
        label: 'Tự nhiên',
        children: [
          { key: 'home_3', label: <Link href='/products?type=herbal'>Thảo dược</Link> },
        ],
      },
    ],
  },
  {
    key: 'products',
    label: <Link href='/products'>Dược mỹ phẩm</Link>,
    children: [
      {
        type: 'group',
        label: 'Chăm sóc',
        children: [
          { key: 'products_1_1', label: <Link href='/products?type=skincare'>Chăm sóc da</Link> },
          { key: 'products_1_2', label: <Link href='/products?type=haircare'>Chăm sóc tóc</Link> },
        ],
      },
      {
        type: 'group',
        label: 'Trang điểm',
        children: [
          { key: 'products_1_3', label: <Link href='/products?type=makeup'>Trang điểm</Link> },
        ],
      },
    ],
  },
  {
    key: 'products_1',
    label: <Link href='/products?cat=1'>Thuốc</Link>,
    children: [
      {
        type: 'group',
        label: 'Loại thuốc',
        children: [
          { key: 'products_1_4', label: <Link href='/products?type=prescription'>Thuốc kê đơn</Link> },
          { key: 'products_1_5', label: <Link href='/products?type=otc'>Thuốc không kê đơn</Link> },
        ],
      },
    ],
  },
  {
    key: 'products_2',
    label: <Link href='/products?cat=2'>Chăm sóc cá nhân</Link>,
    children: [
      {
        type: 'group',
        label: 'Vệ sinh',
        children: [
          { key: 'products_2_1', label: <Link href='/products?type=hygiene'>Vệ sinh cá nhân</Link> },
          { key: 'products_2_2', label: <Link href='/products?type=oralcare'>Chăm sóc răng miệng</Link> },
        ],
      },
    ],
  },
  { key: 'products_3', label: <Link href='/products?cat=3'>Thiết bị y tế</Link> },
  { key: 'products_4', label: <Link href='/products?cat=4'>Tiêm chủng</Link> },
  {
    key: 'promotions',
    label: <Link href='/promotions'>Bệnh & Góc sức khỏe</Link>,
    children: [
      {
        type: 'group',
        label: 'Thông tin sức khỏe',
        children: [
          { key: 'promotions_1', label: <Link href='/promotions?type=health-tips'>Mẹo sức khỏe</Link> },
          { key: 'promotions_2', label: <Link href='/promotions?type=diseases'>Thông tin bệnh</Link> },
        ],
      },
    ],
  },
  { key: 'about', label: <Link href='/about'>Hệ thống nhà thuốc</Link> },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const cartItems = useCartStore((state) => state.items);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const { user, logout } = useUser();
  const router = useRouter();

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearch = (): void => {
    if (searchQuery) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const menuItems: MenuProps['items'] = items.map((item) => ({
    key: item.key,
    label: item.label,
    children: item.children?.map((child) =>
      'type' in child && child.type === 'group'
        ? {
          type: 'group',
          label: child.label,
          children: child.children.map((subChild) => ({
            key: subChild.key,
            label: subChild.label,
          })),
        }
        : {
          key: (child as CustomMenuItem).key,
          label: (child as CustomMenuItem).label,
        }
    ),
  }));

  const searchKeywordMenuItems: MenuProps['items'] = [
    { key: 'search_milk', label: <Link href='/products?search=sua'>Sữa</Link> },
    { key: 'search_vaccine', label: <Link href='/products?search=vaccine'>Vaccine</Link> },
    { key: 'search_vitamin', label: <Link href='/products?search=vitamin'>Vitamin</Link> },
    { key: 'search_oto', label: <Link href='/products?search=oto'>Ô tô đồ chơi</Link> },
  ];

  const userMenuItems: MenuProps['items'] = [
    ...(user && user.roles && user.roles.includes('admin')
      ? [
        {
          key: 'admin',
          label: <Link href='/admin'>Trang quản trị</Link>,
        },
        {
          key: 'account-management',
          label: <Link href='/admin/accounts'>Quản lý tài khoản</Link>,
        }
      ]
      : []),
    ...(user && user.roles && user.roles.includes('staff')
      ? [
        {
          key: 'order-management',
          label: <Link href='/staff/orders'>Quản lý đơn hàng</Link>,
        }
      ]
      : []),
    ...(user && user.roles && user.roles.includes('customer')
      ? [
        {
          key: 'profile',
          label: <Link href='/profile'>Hồ sơ</Link>,
        }
      ]
      : []),
    {
      key: 'logout',
      label: 'Đăng xuất',
      onClick: () => {
        logout();
        router.push('/login');
      },
    },
  ];

  return (
    <header>
      <div className='bg-[#3c81e8] hidden md:block text-white py-2'>
        <div className='container mx-auto flex justify-between'>
          <div className='flex gap-3'>
            <span>Trung tâm tiêm chủng Long Châu</span>
            <span>
              <a href='https://tiemchunglongchau.com.vn/' className='!underline !text-white font-bold'>
                Xem chi tiết
              </a>
            </span>
          </div>
          <div className='flex justify-end'>
            <span className='mx-3 cursor-default'>
              <MobileFilled /> {'\u00A0'}
              <Popover content={<QRCode value="https://longchau.com.vn/app" bordered={false} size={100} />}>
                Tải ứng dụng
              </Popover>
            </span>
            <span className='cursor-default'>
              <PhoneFilled /> {'\u00A0'}
              Tư vấn ngay:{'\u00A0'}
            </span>
            <span>
              <a href='tel:18006928' className=' !text-white'>1800 6928</a>
            </span>
          </div>
        </div>
      </div>

      <div className='md:bg-[url("/assets/images/bg-header.png")] bg-cover bg-[#3c81e8]'>
        <div className='container mx-auto'>
          <div className='flex justify-between items-center md:hidden px-3 py-2'>
            <Button
              icon={<MenuOutlined />}
              onClick={toggleMenu}
              style={{ fontSize: '24px' }}
              className='!text-white !bg-transparent !border-none'
            />
            <Link href='/'>
              <Image
                src='/assets/images/logo.png'
                alt='logo'
                width={120}
                height={40}
                className='object-cover'
                priority
              />
            </Link>
            <Link href='/cart' className='text-white'>
              <Badge count={cartItemCount} size="small">
                <ShoppingCartOutlined style={{ fontSize: '24px', color: 'white' }} />
              </Badge>
            </Link>
          </div>

          <div className='hidden md:flex align-bottom'>
            <div className='flex basis-[20%] mt-3'>
              <Link href='/'>
                <Image
                  src='/assets/images/logo.png'
                  alt='logo'
                  width={200}
                  height={60}
                  className='object-contain'
                  priority
                />
              </Link>
            </div>

            <div className='flex basis-[60%] items-center px-4 mt-3'>
              <Input
                placeholder='Tìm kiếm sản phẩm...'
                value={searchQuery}
                onChange={handleChange}
                suffix={
                  <Button
                    icon={<SearchOutlined />}
                    onClick={handleSearch}
                    type='text'
                  />
                }
                className='custom-search-bar'
                style={{ borderRadius: '30px' }}
              />
            </div>
            <div className='flex basis-[25%] justify-evenly'>
              <div className='text-white custom-cart'>
                <Link href='/cart' className='flex items-center'>
                  <Badge count={cartItemCount} size="small">
                    <ShoppingCartOutlined style={{ fontSize: '24px', color: 'white' }} />
                  </Badge>
                  <span className='ml-1'>Giỏ hàng</span>
                </Link>
              </div>
              <div className='text-white custom-account'>
                {user ? (
                  <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                    <div className='flex items-center cursor-pointer'>
                      <UserOutlined style={{ fontSize: '24px' }} />
                      <span className='ml-1'>{user.hoten}</span>
                      <DownOutlined className='ml-1' style={{ fontSize: '12px' }} />
                    </div>
                  </Dropdown>
                ) : (
                  <Link href='/login' className='flex items-center'>
                    <UserOutlined style={{ fontSize: '24px' }} />
                    <span className='ml-1'>Tài khoản</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className='hidden md:inline'>
            <div className='flex justify-center'>
              <Menu
                style={{
                  background: 'transparent',
                  color: '#fff',
                  width: '100%',
                  justifyContent: 'center',
                }}
                mode='horizontal'
                items={searchKeywordMenuItems}
                className='custom-menu'
              />
            </div>
          </div>
        </div>
      </div>

      <div className='hidden md:block'>
        <div className='flex justify-center'>
          <Menu
            mode='horizontal'
            items={menuItems}
            style={{
              width: '100%',
              justifyContent: 'center',
            }}
          />
        </div>
      </div>

      <Drawer
        title='Menu'
        placement='left'
        onClose={toggleMenu}
        open={isMenuOpen}
        closeIcon={<CloseOutlined />}
        width={300}
      >
        <div className='flex items-center custom-ant-menu mb-4'>
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
              <div className='flex items-center cursor-pointer'>
                <UserOutlined className='mr-2' />
                <span>{user.hoten}</span>
                <DownOutlined className='ml-1' style={{ fontSize: '12px' }} />
              </div>
            </Dropdown>
          ) : (
            <Link href='/login' className='flex items-center'>
              <UserOutlined className='mr-2' />
              Tài khoản
            </Link>
          )}
        </div>
        <Menu
          mode='inline'
          items={menuItems}
          className='border-none'
        />
      </Drawer>
    </header>
  );
};

export default Header;