# 🗄️ ΑΠΑΙΤΗΣΕΙΣ ΣΧΗΜΑΤΟΣ ΒΑΣΗΣ ΔΕΔΟΜΕΝΩΝ
## Αναλυτικός Οδηγός για Supabase Database Setup

---

## 📋 ΕΠΙΣΚΟΠΗΣΗ ΤΡΕΧΟΥΣΑΣ ΚΑΤΑΣΤΑΣΗΣ

### Υπάρχοντες Πίνακες (Στο Supabase σας)
Σύμφωνα με το development plan, έχετε ήδη:
- ✅ `citizens` (21 εγγραφές)
- ✅ `requests` (2 εγγραφές) 
- ✅ `military_personnel` (1 εγγραφή)
- ✅ `reminders` (26 εγγραφές)
- ✅ `user_profiles`

### Mock Data Schema στον Κώδικα
Το current application χρησιμοποιεί διαφορετικό schema στα Zustand stores από αυτό που υπάρχει στο Supabase.

---

## 🔄 SCHEMA COMPATIBILITY MAPPING

### Citizens Table Mapping

**Supabase Schema (Υπάρχον):**
```sql
citizens:
- id (uuid)
- surname (text)
- name (text) 
- recommendation_from (text)
- patronymic (text)
- mobile_phone (text)
- landline_phone (text)
- email (text)
- address (text)
- postal_code (text)
- municipality (text)
- area (text)
- electoral_district (text)
- last_contact_date (date)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)
- created_by (uuid)
```

**Mock Data Schema (Στον κώδικα):**
```typescript
interface Citizen {
  id: string
  name: string
  surname: string
  afm: string          // ❌ Δεν υπάρχει στο Supabase
  phone: string        // ➡️ Mapping σε mobile_phone
  email: string        // ✅ Ίδιο
  address: string      // ✅ Ίδιο  
  city: string         // ➡️ Mapping σε area
  postalCode?: string  // ➡️ Mapping σε postal_code
  municipality?: string // ✅ Ίδιο
  electoralDistrict?: string // ➡️ Mapping σε electoral_district
  notes?: string       // ✅ Ίδιο
  status: 'active' | 'inactive' // ❌ Δεν υπάρχει στο Supabase
  created_at: string   // ✅ Ίδιο
  updated_at: string   // ✅ Ίδιο
}
```

**Απαιτούμενες Αλλαγές στο Supabase:**

```sql
-- Προσθήκη AFM column (υποχρεωτικό στον κώδικα)
ALTER TABLE citizens ADD COLUMN afm VARCHAR(11);
CREATE UNIQUE INDEX idx_citizens_afm ON citizens(afm);

-- Προσθήκη status column
ALTER TABLE citizens ADD COLUMN status VARCHAR(10) DEFAULT 'active';
ALTER TABLE citizens ADD CONSTRAINT chk_citizens_status 
  CHECK (status IN ('active', 'inactive'));

-- Indexes για καλύτερη απόδοση
CREATE INDEX idx_citizens_status ON citizens(status);
CREATE INDEX idx_citizens_municipality ON citizens(municipality);
CREATE INDEX idx_citizens_electoral_district ON citizens(electoral_district);
CREATE INDEX idx_citizens_created_at ON citizens(created_at DESC);
```

---

### Requests Table Mapping

**Supabase Schema (Υπάρχον):**
```sql
requests:
- id (uuid)
- citizen_id (uuid) → references citizens(id)
- military_personnel_id (uuid) → references military_personnel(id)
- request_type (text)
- description (text)
- status (text) 'ΕΚΚΡΕΜΕΙ' | 'ΟΛΟΚΛΗΡΩΘΗΚΕ' | 'ΑΠΟΡΡΙΦΘΗΚΕ'
- send_date (date)
- completion_date (date)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)
- created_by (uuid)
```

**Mock Data Schema (Στον κώδικα):**
```typescript
interface Request {
  id: string
  citizenId: string    // ➡️ Mapping σε citizen_id
  title: string        // ❌ Δεν υπάρχει, χρησιμοποιούμε request_type
  description: string  // ✅ Ίδιο
  status: 'pending' | 'in-progress' | 'completed' // ❌ Διαφορετικές τιμές
  priority: 'low' | 'medium' | 'high'             // ❌ Δεν υπάρχει
  created_at: string   // ✅ Ίδιο
  updated_at: string   // ✅ Ίδιο
  citizenName?: string // ❌ Δεν αποθηκεύεται, JOIN με citizens
}
```

**Απαιτούμενες Αλλαγές στο Supabase:**

```sql
-- Προσθήκη priority column
ALTER TABLE requests ADD COLUMN priority VARCHAR(10) DEFAULT 'medium';
ALTER TABLE requests ADD CONSTRAINT chk_requests_priority 
  CHECK (priority IN ('low', 'medium', 'high'));

-- Ενημέρωση status values για συμβατότητα
ALTER TABLE requests DROP CONSTRAINT IF EXISTS chk_requests_status;
ALTER TABLE requests ADD CONSTRAINT chk_requests_status 
  CHECK (status IN ('pending', 'in-progress', 'completed', 'ΕΚΚΡΕΜΕΙ', 'ΟΛΟΚΛΗΡΩΘΗΚΕ', 'ΑΠΟΡΡΙΦΘΗΚΕ'));

-- Indexes
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_priority ON requests(priority);
CREATE INDEX idx_requests_citizen_id ON requests(citizen_id);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);
```

---

### Military Personnel Table Mapping

**Supabase Schema (Υπάρχον):**
```sql
military_personnel:
- id (uuid)
- name (text)
- surname (text)
- rank (text)
- service_unit (text)
- wish (text)
- send_date (date)
- comments (text)
- military_id (text)
- esso (text)
- esso_year (text)
- esso_letter ('Α' | 'Β' | 'Γ' | 'Δ' | 'Ε' | 'ΣΤ')
- created_at (timestamptz)
- updated_at (timestamptz)
- created_by (uuid)
```

**Mock Data Schema (Στον κώδικα):**
```typescript
interface MilitaryPersonnel {
  id: string
  name: string         // ✅ Ίδιο
  surname: string      // ✅ Ίδιο
  rank: string         // ✅ Ίδιο
  militaryId: string   // ➡️ Mapping σε military_id
  unit: string         // ➡️ Mapping σε service_unit
  esso: string         // ✅ Ίδιο
  essoYear: string     // ➡️ Mapping σε esso_year
  essoLetter: string   // ➡️ Mapping σε esso_letter
  requestType: string  // ➡️ Mapping σε wish
  status: 'pending' | 'approved' | 'rejected' | 'completed' // ❌ Δεν υπάρχει
  created_at: string   // ✅ Ίδιο
  updated_at: string   // ✅ Ίδιο
}
```

**Απαιτούμενες Αλλαγές στο Supabase:**

```sql
-- Προσθήκη status column
ALTER TABLE military_personnel ADD COLUMN status VARCHAR(15) DEFAULT 'pending';
ALTER TABLE military_personnel ADD CONSTRAINT chk_military_status 
  CHECK (status IN ('pending', 'approved', 'rejected', 'completed'));

-- Indexes για ΕΣΣΟ αναζήτηση
CREATE INDEX idx_military_esso_year ON military_personnel(esso_year);
CREATE INDEX idx_military_esso_letter ON military_personnel(esso_letter);
CREATE INDEX idx_military_status ON military_personnel(status);
CREATE INDEX idx_military_created_at ON military_personnel(created_at DESC);

-- Composite index για ΕΣΣΟ searches
CREATE INDEX idx_military_esso_combined ON military_personnel(esso_year, esso_letter);
```

---

## 🆕 ΝΕΟΙ ΠΙΝΑΚΕΣ ΑΠΑΙΤΟΥΜΕΝΟΙ

### 1. Communication Dates Table

**Για το Communication Timeline feature:**

```sql
CREATE TABLE citizen_communication_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  communication_date DATE NOT NULL,
  communication_type VARCHAR(20) DEFAULT 'ΓΕΝΙΚΗ',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Constraints
ALTER TABLE citizen_communication_dates ADD CONSTRAINT chk_communication_type 
  CHECK (communication_type IN ('ΓΕΝΙΚΗ', 'ΤΗΛΕΦΩΝΙΚΗ', 'EMAIL', 'ΠΡΟΣΩΠΙΚΗ', 'SMS'));

-- Indexes
CREATE INDEX idx_citizen_communication_citizen_id ON citizen_communication_dates(citizen_id);
CREATE INDEX idx_citizen_communication_date ON citizen_communication_dates(communication_date DESC);
CREATE INDEX idx_citizen_communication_created_at ON citizen_communication_dates(created_at DESC);

-- RLS Policies
ALTER TABLE citizen_communication_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all communication dates" ON citizen_communication_dates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert communication dates" ON citizen_communication_dates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update communication dates" ON citizen_communication_dates
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete communication dates" ON citizen_communication_dates
  FOR DELETE USING (auth.role() = 'authenticated');
```

### 2. Groups Table (Προαιρετικό)

**Για ομαδοποίηση πολιτών:**

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  recommendation_from VARCHAR(255),
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color για UI
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Constraints
CREATE UNIQUE INDEX idx_groups_name ON groups(name) WHERE is_active = true;

-- Add group_id to citizens
ALTER TABLE citizens ADD COLUMN group_id UUID REFERENCES groups(id);
CREATE INDEX idx_citizens_group_id ON citizens(group_id);

-- RLS Policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all groups" ON groups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert groups" ON groups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update groups" ON groups
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete groups" ON groups
  FOR DELETE USING (auth.role() = 'authenticated');
```

---

## 🔧 DATABASE FUNCTIONS & TRIGGERS

### 1. Auto-Update Timestamps

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all relevant tables
CREATE TRIGGER update_citizens_updated_at 
  BEFORE UPDATE ON citizens 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at 
  BEFORE UPDATE ON requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_military_updated_at 
  BEFORE UPDATE ON military_personnel 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at 
  BEFORE UPDATE ON groups 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Statistics Functions

```sql
-- Function to get citizen statistics
CREATE OR REPLACE FUNCTION get_citizen_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'active', COUNT(*) FILTER (WHERE status = 'active'),
        'inactive', COUNT(*) FILTER (WHERE status = 'inactive'),
        'recent', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')
    ) INTO result
    FROM citizens;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get request statistics  
CREATE OR REPLACE FUNCTION get_request_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE status IN ('pending', 'ΕΚΚΡΕΜΕΙ')),
        'completed', COUNT(*) FILTER (WHERE status IN ('completed', 'ΟΛΟΚΛΗΡΩΘΗΚΕ')),
        'in_progress', COUNT(*) FILTER (WHERE status = 'in-progress'),
        'rejected', COUNT(*) FILTER (WHERE status IN ('rejected', 'ΑΠΟΡΡΙΦΘΗΚΕ'))
    ) INTO result
    FROM requests;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get military statistics
CREATE OR REPLACE FUNCTION get_military_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'by_year', json_object_agg(esso_year, year_count),
        'by_status', json_build_object(
            'pending', COUNT(*) FILTER (WHERE status = 'pending'),
            'approved', COUNT(*) FILTER (WHERE status = 'approved'),
            'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
            'completed', COUNT(*) FILTER (WHERE status = 'completed')
        )
    ) INTO result
    FROM military_personnel
    LEFT JOIN (
        SELECT esso_year, COUNT(*) as year_count 
        FROM military_personnel 
        WHERE esso_year IS NOT NULL 
        GROUP BY esso_year
    ) year_stats ON military_personnel.esso_year = year_stats.esso_year;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 VIEWS ΓΙΑ REPORTING

### 1. Citizens with Communication Info

```sql
CREATE VIEW citizens_with_last_communication AS
SELECT 
    c.*,
    ccd.last_communication_date,
    ccd.last_communication_type,
    COALESCE(r.request_count, 0) as total_requests
FROM citizens c
LEFT JOIN (
    SELECT 
        citizen_id,
        MAX(communication_date) as last_communication_date,
        FIRST_VALUE(communication_type) OVER (
            PARTITION BY citizen_id 
            ORDER BY communication_date DESC
        ) as last_communication_type
    FROM citizen_communication_dates
    GROUP BY citizen_id, communication_type
) ccd ON c.id = ccd.citizen_id
LEFT JOIN (
    SELECT citizen_id, COUNT(*) as request_count
    FROM requests
    GROUP BY citizen_id
) r ON c.id = r.citizen_id;
```

### 2. Full Request Details

```sql
CREATE VIEW request_details AS
SELECT 
    r.*,
    c.name as citizen_name,
    c.surname as citizen_surname,
    c.municipality as citizen_municipality,
    mp.name as military_name,
    mp.surname as military_surname,
    mp.rank as military_rank
FROM requests r
LEFT JOIN citizens c ON r.citizen_id = c.id
LEFT JOIN military_personnel mp ON r.military_personnel_id = mp.id;
```

### 3. ΕΣΣΟ Summary

```sql
CREATE VIEW esso_summary AS
SELECT 
    esso_year,
    esso_letter,
    COUNT(*) as personnel_count,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count
FROM military_personnel
WHERE esso_year IS NOT NULL
GROUP BY esso_year, esso_letter
ORDER BY esso_year DESC, esso_letter;
```

---

## 🗂️ FULL DATABASE SETUP SCRIPT

### Complete Setup για Fresh Supabase Project

```sql
-- ============================
-- COMPLETE DATABASE SETUP
-- ============================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================
-- CORE TABLES
-- ============================

-- Citizens Table (Extended)
CREATE TABLE IF NOT EXISTS citizens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surname VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    afm VARCHAR(11) UNIQUE, -- Added for compatibility
    recommendation_from VARCHAR(255),
    patronymic VARCHAR(100),
    mobile_phone VARCHAR(20),
    landline_phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    postal_code VARCHAR(10),
    municipality VARCHAR(100),
    area VARCHAR(100),
    electoral_district VARCHAR(50),
    last_contact_date DATE,
    notes TEXT,
    status VARCHAR(10) DEFAULT 'active', -- Added for compatibility
    group_id UUID, -- Will be set up later
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Requests Table (Extended)
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id UUID REFERENCES citizens(id) ON DELETE CASCADE,
    military_personnel_id UUID REFERENCES military_personnel(id) ON DELETE CASCADE,
    request_type VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(10) DEFAULT 'medium', -- Added for compatibility
    send_date DATE,
    completion_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Military Personnel Table (Extended)
CREATE TABLE IF NOT EXISTS military_personnel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    rank VARCHAR(50),
    service_unit VARCHAR(255),
    wish TEXT,
    send_date DATE,
    comments TEXT,
    military_id VARCHAR(50),
    esso VARCHAR(10),
    esso_year VARCHAR(4),
    esso_letter VARCHAR(2),
    status VARCHAR(15) DEFAULT 'pending', -- Added for compatibility
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reminder_date DATE NOT NULL,
    reminder_type VARCHAR(20) DEFAULT 'ΓΕΝΙΚΗ',
    related_request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    email VARCHAR(255)
);

-- Communication Dates Table
CREATE TABLE IF NOT EXISTS citizen_communication_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
    communication_date DATE NOT NULL,
    communication_type VARCHAR(20) DEFAULT 'ΓΕΝΙΚΗ',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Groups Table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    recommendation_from VARCHAR(255),
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Add foreign key reference after groups table is created
ALTER TABLE citizens ADD CONSTRAINT fk_citizens_group 
    FOREIGN KEY (group_id) REFERENCES groups(id);

-- ============================
-- CONSTRAINTS
-- ============================

-- Citizens constraints
ALTER TABLE citizens ADD CONSTRAINT chk_citizens_status 
    CHECK (status IN ('active', 'inactive'));

ALTER TABLE citizens ADD CONSTRAINT chk_citizens_electoral_district
    CHECK (electoral_district IN ('Α ΘΕΣΣΑΛΟΝΙΚΗΣ', 'Β ΘΕΣΣΑΛΟΝΙΚΗΣ'));

ALTER TABLE citizens ADD CONSTRAINT chk_citizens_municipality
    CHECK (municipality IN ('ΠΑΥΛΟΥ ΜΕΛΑ', 'ΚΟΡΔΕΛΙΟΥ-ΕΥΟΣΜΟΥ', 'ΑΜΠΕΛΟΚΗΠΩΝ-ΜΕΝΕΜΕΝΗΣ', 
                            'ΝΕΑΠΟΛΗΣ-ΣΥΚΕΩΝ', 'ΘΕΣΣΑΛΟΝΙΚΗΣ', 'ΚΑΛΑΜΑΡΙΑΣ', 'ΑΛΛΟ'));

-- Requests constraints  
ALTER TABLE requests ADD CONSTRAINT chk_requests_status 
    CHECK (status IN ('pending', 'in-progress', 'completed', 'rejected', 
                      'ΕΚΚΡΕΜΕΙ', 'ΟΛΟΚΛΗΡΩΘΗΚΕ', 'ΑΠΟΡΡΙΦΘΗΚΕ'));

ALTER TABLE requests ADD CONSTRAINT chk_requests_priority 
    CHECK (priority IN ('low', 'medium', 'high'));

-- Military constraints
ALTER TABLE military_personnel ADD CONSTRAINT chk_military_status 
    CHECK (status IN ('pending', 'approved', 'rejected', 'completed'));

ALTER TABLE military_personnel ADD CONSTRAINT chk_military_esso_letter
    CHECK (esso_letter IN ('Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ'));

-- Communication constraints
ALTER TABLE citizen_communication_dates ADD CONSTRAINT chk_communication_type 
    CHECK (communication_type IN ('ΓΕΝΙΚΗ', 'ΤΗΛΕΦΩΝΙΚΗ', 'EMAIL', 'ΠΡΟΣΩΠΙΚΗ', 'SMS'));

-- Reminders constraints
ALTER TABLE reminders ADD CONSTRAINT chk_reminders_type
    CHECK (reminder_type IN ('ΕΟΡΤΗ', 'ΑΙΤΗΜΑ', 'ΓΕΝΙΚΗ'));

-- Groups constraints
CREATE UNIQUE INDEX idx_groups_name_unique ON groups(name) WHERE is_active = true;

-- ============================
-- INDEXES FOR PERFORMANCE
-- ============================

-- Citizens indexes
CREATE INDEX idx_citizens_afm ON citizens(afm);
CREATE INDEX idx_citizens_status ON citizens(status);
CREATE INDEX idx_citizens_municipality ON citizens(municipality);
CREATE INDEX idx_citizens_electoral_district ON citizens(electoral_district);
CREATE INDEX idx_citizens_created_at ON citizens(created_at DESC);
CREATE INDEX idx_citizens_group_id ON citizens(group_id);
CREATE INDEX idx_citizens_name_search ON citizens USING gin((name || ' ' || surname) gin_trgm_ops);

-- Requests indexes
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_priority ON requests(priority);
CREATE INDEX idx_requests_citizen_id ON requests(citizen_id);
CREATE INDEX idx_requests_military_id ON requests(military_personnel_id);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX idx_requests_send_date ON requests(send_date);

-- Military indexes
CREATE INDEX idx_military_esso_year ON military_personnel(esso_year);
CREATE INDEX idx_military_esso_letter ON military_personnel(esso_letter);
CREATE INDEX idx_military_status ON military_personnel(status);
CREATE INDEX idx_military_created_at ON military_personnel(created_at DESC);
CREATE INDEX idx_military_esso_combined ON military_personnel(esso_year, esso_letter);

-- Communication indexes
CREATE INDEX idx_citizen_communication_citizen_id ON citizen_communication_dates(citizen_id);
CREATE INDEX idx_citizen_communication_date ON citizen_communication_dates(communication_date DESC);
CREATE INDEX idx_citizen_communication_created_at ON citizen_communication_dates(created_at DESC);

-- Reminders indexes
CREATE INDEX idx_reminders_date ON reminders(reminder_date);
CREATE INDEX idx_reminders_type ON reminders(reminder_type);
CREATE INDEX idx_reminders_completed ON reminders(is_completed);
CREATE INDEX idx_reminders_request_id ON reminders(related_request_id);

-- ============================
-- FUNCTIONS & TRIGGERS
-- ============================

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_citizens_updated_at 
    BEFORE UPDATE ON citizens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at 
    BEFORE UPDATE ON requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_military_updated_at 
    BEFORE UPDATE ON military_personnel 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at 
    BEFORE UPDATE ON groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================
-- RLS POLICIES
-- ============================

-- Enable RLS for all tables
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE military_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_communication_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Citizens policies
CREATE POLICY "Users can view all citizens" ON citizens
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert citizens" ON citizens
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update citizens" ON citizens
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete citizens" ON citizens
    FOR DELETE USING (auth.role() = 'authenticated');

-- Requests policies
CREATE POLICY "Users can view all requests" ON requests
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert requests" ON requests
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update requests" ON requests
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete requests" ON requests
    FOR DELETE USING (auth.role() = 'authenticated');

-- Military policies
CREATE POLICY "Users can view all military personnel" ON military_personnel
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert military personnel" ON military_personnel
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update military personnel" ON military_personnel
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete military personnel" ON military_personnel
    FOR DELETE USING (auth.role() = 'authenticated');

-- Reminders policies
CREATE POLICY "Users can view all reminders" ON reminders
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert reminders" ON reminders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update reminders" ON reminders
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete reminders" ON reminders
    FOR DELETE USING (auth.role() = 'authenticated');

-- Communication dates policies
CREATE POLICY "Users can view all communication dates" ON citizen_communication_dates
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert communication dates" ON citizen_communication_dates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update communication dates" ON citizen_communication_dates
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete communication dates" ON citizen_communication_dates
    FOR DELETE USING (auth.role() = 'authenticated');

-- Groups policies
CREATE POLICY "Users can view all groups" ON groups
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert groups" ON groups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update groups" ON groups
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete groups" ON groups
    FOR DELETE USING (auth.role() = 'authenticated');

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- ============================
-- STATISTICAL FUNCTIONS
-- ============================

CREATE OR REPLACE FUNCTION get_citizen_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'active', COUNT(*) FILTER (WHERE status = 'active'),
        'inactive', COUNT(*) FILTER (WHERE status = 'inactive'),
        'recent', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')
    ) INTO result
    FROM citizens;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_request_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE status IN ('pending', 'ΕΚΚΡΕΜΕΙ')),
        'completed', COUNT(*) FILTER (WHERE status IN ('completed', 'ΟΛΟΚΛΗΡΩΘΗΚΕ')),
        'in_progress', COUNT(*) FILTER (WHERE status = 'in-progress'),
        'rejected', COUNT(*) FILTER (WHERE status IN ('rejected', 'ΑΠΟΡΡΙΦΘΗΚΕ'))
    ) INTO result
    FROM requests;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_military_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'approved', COUNT(*) FILTER (WHERE status = 'approved'),
        'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
        'completed', COUNT(*) FILTER (WHERE status = 'completed')
    ) INTO result
    FROM military_personnel;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- VIEWS
-- ============================

CREATE VIEW citizens_with_last_communication AS
SELECT 
    c.*,
    ccd.last_communication_date,
    ccd.last_communication_type,
    COALESCE(r.request_count, 0) as total_requests
FROM citizens c
LEFT JOIN LATERAL (
    SELECT 
        communication_date as last_communication_date,
        communication_type as last_communication_type
    FROM citizen_communication_dates
    WHERE citizen_id = c.id
    ORDER BY communication_date DESC
    LIMIT 1
) ccd ON true
LEFT JOIN (
    SELECT citizen_id, COUNT(*) as request_count
    FROM requests
    GROUP BY citizen_id
) r ON c.id = r.citizen_id;

CREATE VIEW request_details AS
SELECT 
    r.*,
    c.name as citizen_name,
    c.surname as citizen_surname,
    c.municipality as citizen_municipality,
    mp.name as military_name,
    mp.surname as military_surname,
    mp.rank as military_rank
FROM requests r
LEFT JOIN citizens c ON r.citizen_id = c.id
LEFT JOIN military_personnel mp ON r.military_personnel_id = mp.id;

CREATE VIEW esso_summary AS
SELECT 
    esso_year,
    esso_letter,
    COUNT(*) as personnel_count,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count
FROM military_personnel
WHERE esso_year IS NOT NULL
GROUP BY esso_year, esso_letter
ORDER BY esso_year DESC, esso_letter;
```

---

## 🎯 ΕΠΟΜΕΝΑ ΒΗΜΑΤΑ

1. **Εκτέλεση του Setup Script** στο Supabase SQL Editor
2. **Δημιουργία Environment Variables** με τα σωστά keys
3. **Testing της σύνδεσης** με τα service layers
4. **Μετάβαση από Mock Data** στα πραγματικά δεδομένα

---

*Αυτό το schema είναι πλήρως συμβατό με το υπάρχον frontend και παρέχει όλες τις απαιτούμενες δυνατότητες για την πλήρη λειτουργία του συστήματός σας.*