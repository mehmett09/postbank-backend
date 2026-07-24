# Postbank Core Banking API 🏦

Postbank, bankacılık temel işlemlerini (Core Banking) simüle eden, RESTful mimariye uygun olarak geliştirilmiş bir backend API projesidir. Sistem; müşteri yönetimi, hesap işlemleri, çifte kayıt muhasebesi (Ledger) ve dinamik komisyon hesaplamalı para transferi (Havale/EFT) özelliklerini barındırmaktadır.

## 🚀 Kullanılan Teknolojiler

* **Backend:** Node.js, Express.js
* **Veritabanı:** PostgreSQL
* **ORM:** Sequelize
* **Kimlik Doğrulama:** JSON Web Token (JWT)

## ⚙️ Temel Özellikler

* **Güvenli Kimlik Doğrulama:** JWT tabanlı kullanıcı kaydı ve girişi.
* **Hesap Yönetimi:** İstenilen sayıda hesap oluşturma, bakiye görüntüleme ve IBAN üretimi.
* **Nakit İşlemleri:** Hesaba para yatırma (Deposit) ve para çekme (Withdraw).
* **Akıllı Para Transferi (Havale & EFT):**
  * Alıcı IBAN'ındaki banka koduna göre işlemin **Havale** (Banka İçi) veya **EFT** (Farklı Banka) olduğuna otomatik karar verilir.
  * EFT işlemlerinde göndericiden otomatik komisyon (Fee) kesintisi yapılır.
* **ACID Transaction Desteği:** Finansal veri tutarlılığını korumak için, para transferi sırasındaki tüm işlemler Sequelize `transaction` (Commit/Rollback) yapısıyla güvence altına alınmıştır.
* **Muhasebe Geçmişi:** Yapılan tüm işlemler, komisyon kesintileri dahil olmak üzere detaylı dekontlar (Transaction tablosu) halinde kayıt altına alınır.

## 🛠️ Kurulum

1. Projeyi bilgisayarınıza klonlayın:
   ```bash
   git clone [https://github.com/kullaniciadin/postbank-api.git](https://github.com/kullaniciadin/postbank-api.git)
   ```

2. Gerekli paketleri yükleyin:
   ```bash
   cd postbank-api
   npm install
   ```

3. Ana dizinde bir `.env` dosyası oluşturun ve veritabanı bilgilerinizi girin:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=postbank_db
   DB_USER=postgres
   DB_PASSWORD=sifreniz
   JWT_SECRET=super_gizli_anahtar
   ```

4. Sunucuyu başlatın (Tablolar Sequelize tarafından otomatik oluşturulacaktır):
   ```bash
   npm start
   ```

## 📡 API Endpoint'leri

Tüm isteklerde `Authorization: Bearer <token>` header'ı kullanılmalıdır (Register ve Login hariç).

### Müşteri (Customer)
* `POST /api/customer/register` - Yeni müşteri kaydı
* `POST /api/customer/login` - Sisteme giriş ve Token alımı
* `POST /api/customer/logout` - Çıkış yapma
* `GET /api/customer/profile` - Müşteri bilgilerini getirme

### Hesap (Account)
* `POST /api/account/create` - Yeni banka hesabı (IBAN) oluşturma
* `GET /api/account/my-accounts` - Müşterinin hesaplarını listeleme
* `POST /api/account/deposit` - Hesaba para yatırma
* `POST /api/account/withdraw` - Hesaptan para çekme
* `GET /api/account/history/:account_number` - Hesap hareketleri dökümü

### Transfer
* `POST /api/transfer/make` - Havale veya EFT işlemi yapma