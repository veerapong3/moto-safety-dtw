# Google Sheets Schema — MOTO-Safety DTW

สร้าง Spreadsheet ใหม่ แล้วรัน `npm run init:sheets`  
Share Spreadsheet ให้ Service Account เป็น **Editor**

## Users

| id | username | password_hash | display_name | role | active | created_at | created_by |
|----|----------|---------------|--------------|------|--------|------------|------------|

- `role`: `admin` | `viewer`
- `active`: `true` | `false`

## Registrations

| id | created_at | updated_at | updated_by | prefix | first_name | last_name | student_id | grade | room | phone | brand | color | plate_number | province | helmet | pillion_name | bike_file_id | plate_file_id | rider_file_id | status | academic_year | notes |
|----|------------|------------|------------|--------|------------|-----------|------------|-------|------|-------|-------|-------|--------------|----------|--------|--------------|--------------|---------------|---------------|--------|---------------|-------|

- `helmet`: `มี` | `ไม่มี`
- `status`: `active` | `deleted`
- `id`: เช่น `MOTO-A1B2C3D4`

## Settings

| key | value |
|-----|-------|

คีย์ที่รองรับ:
- `DRIVE_ROOT_FOLDER_ID`
- `SCHOOL_NAME` / `APP_TITLE`
- `REGISTRATION_OPEN` → `true` / `false`
- `CLOSED_MESSAGE`
- `GRADES` → `ม.1,ม.2,ม.3,ม.4,ม.5,ม.6`
- `ROOMS` → `1,2,3,4,5,6,7`
- `BRANDS` / `COLORS`
- `SAMPLE_BIKE_FILE_ID` / `SAMPLE_PLATE_FILE_ID` / `SAMPLE_RIDER_FILE_ID`
- `CONTACT_EMAIL`
- `CURRENT_ACADEMIC_YEAR`
