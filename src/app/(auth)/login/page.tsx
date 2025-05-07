import type { Metadata } from 'next';
import Image from 'next/image';
import styles from './login.module.css';

export const metadata: Metadata = {
  title: 'Đăng nhập - Long Châu E-Commerce',
  description: 'Đăng nhập để mua sắm sản phẩm y tế và sức khỏe tại Long Châu',
};

export default function Login() {
  return (
    <div className={styles.container}>
      <Image
        src="/assets/icons/background1.svg"
        alt=""
        width={100}
        height={100}
        className={styles.background1}
        role="presentation"
      />
      <Image
        src="/assets/icons/background2.svg"
        alt=""
        width={100}
        height={100}
        className={styles.background2}
        role="presentation"
      />
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Đăng nhập</h1>
        <form className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Mật khẩu</label>
            <input type="password" id="password" name="password" required className={styles.input} />
          </div>
          <button type="submit" className={styles.submitButton}>Đăng nhập</button>
        </form>
      </div>
    </div>
  );
}