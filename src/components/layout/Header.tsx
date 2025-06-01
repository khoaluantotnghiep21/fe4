'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, ChangeEvent, useEffect } from 'react';
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
import { getLoais } from '@/lib/api/loaiApi';
import { getDanhMucByLoai } from '@/lib/api/danhMucApi';
import { Loai } from '@/types/loai.types';
import { DanhMuc } from '@/types/danhmuc.types';
import { useLoading } from '@/context/LoadingContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isComposing, setIsComposing] = useState<boolean>(false); // Track IME composition
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false); // Track Dropdown state
  const [loais, setLoais] = useState<Loai[]>([]);
  const [danhMucByLoai, setDanhMucByLoai] = useState<Record<string, DanhMuc[]>>({});
  const cartItems = useCartStore((state) => state.items);
  const cartItemCount = cartItems.length;
  const { user, logout } = useUser();
  const router = useRouter();
  const { showLoading } = useLoading();

  // Load search history from localStorage
  useEffect(() => {
    const loadHistory = () => {
      if (typeof window !== 'undefined') {
        try {
          const userKey = user?.id ? `searchHistory_${user.id}` : 'searchHistory_guest';
          const history = JSON.parse(localStorage.getItem(userKey) || '[]');
          setSearchHistory(history);
        } catch (error) {
          console.error('Error parsing search history:', error);
          setSearchHistory([]);
        }
      }
    };

    loadHistory();
  }, [user]);

  // Save search history to localStorage
  const saveHistory = (history: string[]) => {
    if (typeof window !== 'undefined') {
      try {
        const userKey = user?.id ? `searchHistory_${user.id}` : 'searchHistory_guest';
        localStorage.setItem(userKey, JSON.stringify(history));
      } catch (error) {
        console.error('Error saving search history:', error);
      }
    }
  };

  // Handle input change
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isComposing) {
      setSearchQuery(e.target.value);
    }
  };

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    const newHistory = [
      searchQuery,
      ...searchHistory.filter((q) => q !== searchQuery).slice(0, 9), // Limit to 10 items
    ];
    setSearchHistory(newHistory);
    saveHistory(newHistory);

    showLoading();
    router.push(`/products?query=${encodeURIComponent(searchQuery)}`);
    setIsDropdownOpen(false); // Close Dropdown after search
  };

  // Clear search history
  const clearHistory = () => {
    setSearchHistory([]);
    saveHistory([]);
  };

  // Dropdown menu for search history
  const filteredHistory = searchQuery
    ? searchHistory.filter((q) => q.toLowerCase().includes(searchQuery.toLowerCase()))
    : searchHistory;

  const searchHistoryMenu: MenuProps['items'] = filteredHistory.length > 0 ? [
    ...filteredHistory.map((item, idx) => ({
      key: idx,
      label: (
        <div
          className="cursor-pointer"
          onClick={() => {
            setSearchQuery(item);
            setTimeout(() => handleSearch(), 0);
          }}
        >
          {item}
        </div>
      ),
    })),
    { type: 'divider' },
    {
      key: 'clear',
      label: 'Xóa lịch sử',
      onClick: clearHistory,
    },
  ] : [
    {
      key: 'empty',
      label: <div className="px-4 py-2 text-gray-400">Không có lịch sử</div>,
      disabled: true,
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const loaiData = await getLoais();
        setLoais(loaiData);

        const danhMucData: Record<string, DanhMuc[]> = {};
        for (const loai of loaiData) {
          const danhMucs = await getDanhMucByLoai(loai.maloai);
          danhMucData[loai.maloai] = danhMucs;
        }
        setDanhMucByLoai(danhMucData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigateToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    showLoading();
    router.push('/cart');
  };

  const menuItems: MenuProps['items'] = loais.map((loai) => {
    const danhMucs = danhMucByLoai[loai.maloai] || [];

    return {
      key: loai.maloai,
      label: <span>{loai.tenloai}</span>,
      children: danhMucs.length > 0 ? [
        {
          type: 'group',
          label: loai.tenloai,
          children: danhMucs.map((danhmuc) => ({
            key: danhmuc.madanhmuc,
            label: <Link href={`/categories/${danhmuc.slug}`} onClick={() => showLoading()}>{danhmuc.tendanhmuc}</Link>,
          })),
        },
      ] : undefined,
    };
  });

  const searchKeywordMenuItems: MenuProps['items'] = [
    { key: 'search_milk', label: <Link href='/products?search=sua' onClick={() => showLoading()}>Sữa</Link> },
    { key: 'search_vitamin', label: <Link href='/products?search=vitamin' onClick={() => showLoading()}>Vitamin</Link> },
    { key: 'search_oto', label: <Link href='/products?search=oto' onClick={() => showLoading()}>Ô tô đồ chơi</Link> },
  ];

  const userMenuItems: MenuProps['items'] = [
    ...(user && user.roles && user.roles.includes('admin')
      ? [
          {
            key: 'admin',
            label: <Link href='/admin' onClick={() => showLoading()}>Trang quản trị</Link>,
          },
          {
            key: 'account-management',
            label: <Link href='/admin/accounts' onClick={() => showLoading()}>Quản lý tài khoản</Link>,
          },
        ]
      : []),
    ...(user && user.roles && user.roles.includes('staff')
      ? [
          {
            key: 'order-management',
            label: <Link href='/staff/orders' onClick={() => showLoading()}>Quản lý đơn hàng</Link>,
          },
        ]
      : []),
    ...(user && user.roles && user.roles.includes('customer')
      ? [
          {
            key: 'profile',
            label: <Link href='/profile' onClick={() => showLoading()}>Hồ sơ</Link>,
          },
        ]
      : []),
    {
      key: 'logout',
      label: 'Đăng xuất',
      onClick: () => {
        showLoading();
        logout();
        router.push('/');
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
            <a href='#' onClick={handleNavigateToCart} className='text-white'>
              <Badge count={cartItemCount} size="small">
                <ShoppingCartOutlined style={{ fontSize: '24px', color: 'white' }} />
              </Badge>
            </a>
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
              <Dropdown
                menu={{ items: searchHistoryMenu }}
                trigger={['click']}
                overlayClassName="search-history-dropdown"
                open={isDropdownOpen && searchHistory.length > 0}
                onOpenChange={(open) => setIsDropdownOpen(open)}
              >
                <Input
                  placeholder='Tìm kiếm sản phẩm...'
                  value={searchQuery}
                  onChange={handleChange}
                  onPressEnter={handleSearch}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={(e) => {
                    setIsComposing(false);
                    setSearchQuery((e.target as HTMLInputElement).value);
                  }}
                  onFocus={() => setIsDropdownOpen(true)} // Open Dropdown on focus
                  suffix={
                    <Button
                      icon={<SearchOutlined />}
                      onClick={handleSearch}
                      type='text'
                    />
                  }
                  className='custom-search-bar'
                  style={{ borderRadius: '30px' }}
                  autoComplete="off"
                />
              </Dropdown>
            </div>
            <div className='flex basis-[25%] justify-evenly'>
              <div className='text-white custom-cart'>
                <a href='#' onClick={handleNavigateToCart} className='flex items-center'>
                  <Badge count={cartItemCount} size="small">
                    <ShoppingCartOutlined style={{ fontSize: '24px', color: 'white' }} />
                  </Badge>
                  <span className='ml-1'>Giỏ hàng</span>
                </a>
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
        <div className='mb-4'>
          <Dropdown
            menu={{ items: searchHistoryMenu }}
            trigger={['click']}
            overlayClassName="search-history-dropdown"
            open={isDropdownOpen && searchHistory.length > 0}
            onOpenChange={(open) => setIsDropdownOpen(open)}
          >
            <Input
              placeholder='Tìm kiếm sản phẩm...'
              value={searchQuery}
              onChange={handleChange}
              onPressEnter={handleSearch}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={(e) => {
                setIsComposing(false);
                setSearchQuery((e.target as HTMLInputElement).value);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              suffix={
                <Button
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  type='text'
                />
              }
              className='custom-search-bar'
              style={{ borderRadius: '30px' }}
              autoComplete="off"
            />
          </Dropdown>
        </div>
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