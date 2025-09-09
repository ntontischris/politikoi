# 🚀 ΟΔΗΓΟΣ ΟΛΟΚΛΗΡΗΣ ΕΝΤΑΞΗΣ SUPABASE 
## Μετάβαση από Mock Data στην Πραγματική Βάση Δεδομένων

---

## 📋 ΕΠΙΣΚΟΠΗΣΗ

Αυτός ο οδηγός περιγράφει βήμα προς βήμα πώς να ενσωματώσετε την πραγματική σας Supabase βάση δεδομένων στο υπάρχον σύστημα διαχείρισης που χρησιμοποιεί αυτή τη στιγμή mock δεδομένα μέσω Zustand stores.

### 📊 ΤΡΕΧΟΥΣΑ ΚΑΤΑΣΤΑΣΗ
- ✅ **Frontend Ready**: Ολοκληρωμένο UI με όλες τις λειτουργίες
- ✅ **Mock Data**: Zustand stores με sample δεδομένα
- ✅ **Supabase Config**: Βασική σύνδεση configured
- ⏳ **Real Data Integration**: Χρειάζεται υλοποίηση

---

## 🏗️ ΑΡΧΙΤΕΚΤΟΝΙΚΗ ΑΛΛΑΓΩΝ

### Τρέχουσα Δομή (Mock Data)
```
Frontend (React) → Zustand Stores → Mock Data (Arrays)
```

### Νέα Δομή (Supabase)
```
Frontend (React) → Zustand Stores → Service Layer → Supabase Client → PostgreSQL
```

---

## 📊 ΑΠΑΙΤΗΣΕΙΣ ΒΑΣΗΣ ΔΕΔΟΜΕΝΩΝ

### 1. Υπάρχοντες Πίνακες (ήδη στο Supabase)
Σύμφωνα με το `DEVELOPMENT_PLAN.md`:

**`citizens`** (21 εγγραφές)
```sql
- id, surname, name, recommendation_from, patronymic
- mobile_phone, landline_phone, email, address, postal_code
- municipality, area, electoral_district, last_contact_date
- notes, created_at, updated_at, created_by
```

**`requests`** (2 εγγραφές) 
```sql
- id, citizen_id, military_personnel_id, request_type
- description, status, send_date, completion_date
- notes, created_at, updated_at, created_by
```

**`military_personnel`** (1 εγγραφή)
```sql
- id, name, surname, rank, service_unit, wish
- send_date, comments, military_id, esso, esso_year, esso_letter
- created_at, updated_at, created_by
```

**`reminders`** (26 εγγραφές)
```sql
- id, title, description, reminder_date, reminder_type
- related_request_id, is_completed, created_at, created_by
```

**`user_profiles`**
```sql
- id, full_name, role, last_login_at, last_login_ip
- is_active, created_at, updated_at, email
```

### 2. Επιπλέον Πίνακες που Χρειάζονται

**`citizen_communication_dates`** - Για tracking επικοινωνίας
```sql
CREATE TABLE citizen_communication_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citizen_id UUID REFERENCES citizens(id) ON DELETE CASCADE,
  communication_date DATE NOT NULL,
  communication_type VARCHAR DEFAULT 'ΓΕΝΙΚΗ',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index για καλύτερη απόδοση
CREATE INDEX idx_citizen_communication_citizen_id ON citizen_communication_dates(citizen_id);
CREATE INDEX idx_citizen_communication_date ON citizen_communication_dates(communication_date DESC);
```

**`groups`** - Για ομαδοποίηση πολιτών (προαιρετικό)
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  recommendation_from VARCHAR,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Προσθήκη group_id στον citizens πίνακα
ALTER TABLE citizens ADD COLUMN group_id UUID REFERENCES groups(id);
```

---

## 🔧 ΒΗΜΑ 1: ΠΡΟΕΤΟΙΜΑΣΙΑ ΠΕΡΙΒΑΛΛΟΝΤΟΣ

### 1.1 Environment Variables
Δημιουργήστε/ενημερώστε το `.env` αρχείο:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 1.2 Package Dependencies
Τα απαραίτητα packages είναι ήδη εγκατεστημένα:
```bash
# Ελέγξτε ότι υπάρχουν
npm list @supabase/supabase-js zustand
```

---

## 🗄️ ΒΗΜΑ 2: ΔΗΜΙΟΥΡΓΙΑ SERVICE LAYER

### 2.1 Δημιουργήστε `src/services/` directory

```bash
mkdir -p src/services
```

### 2.2 Base Service Class

**`src/services/baseService.ts`**
```typescript
import { supabase } from '../lib/supabase'
import { PostgrestError } from '@supabase/supabase-js'

export abstract class BaseService {
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  protected handleError(error: PostgrestError | Error | null, operation: string): never {
    console.error(`Σφάλμα στο ${operation}:`, error)
    
    if (error) {
      throw new Error(error.message || `Σφάλμα κατά το ${operation}`)
    }
    
    throw new Error(`Άγνωστο σφάλμα κατά το ${operation}`)
  }

  protected validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new Error('Μη έγκυρο ID')
    }
  }
}
```

### 2.3 Citizens Service

**`src/services/citizensService.ts`**
```typescript
import { BaseService } from './baseService'
import { supabase, Citizen } from '../lib/supabase'

export class CitizensService extends BaseService {
  constructor() {
    super('citizens')
  }

  async getAllCitizens(): Promise<Citizen[]> {
    try {
      const { data, error } = await supabase
        .from('citizens')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση πολιτών')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση πολιτών')
    }
  }

  async getCitizenById(id: string): Promise<Citizen | null> {
    try {
      this.validateId(id)
      
      const { data, error } = await supabase
        .from('citizens')
        .select('*')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'φόρτωση πολίτη')
      }

      return data || null
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση πολίτη')
    }
  }

  async createCitizen(citizenData: Omit<Citizen, 'id' | 'created_at' | 'updated_at'>): Promise<Citizen> {
    try {
      const { data, error } = await supabase
        .from('citizens')
        .insert([citizenData])
        .select()
        .single()

      if (error) this.handleError(error, 'δημιουργία πολίτη')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'δημιουργία πολίτη')
    }
  }

  async updateCitizen(id: string, citizenData: Partial<Citizen>): Promise<Citizen> {
    try {
      this.validateId(id)
      
      const { data, error } = await supabase
        .from('citizens')
        .update({ ...citizenData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) this.handleError(error, 'ενημέρωση πολίτη')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'ενημέρωση πολίτη')
    }
  }

  async deleteCitizen(id: string): Promise<void> {
    try {
      this.validateId(id)
      
      const { error } = await supabase
        .from('citizens')
        .delete()
        .eq('id', id)

      if (error) this.handleError(error, 'διαγραφή πολίτη')
    } catch (error) {
      this.handleError(error as Error, 'διαγραφή πολίτη')
    }
  }

  async searchCitizens(searchTerm: string): Promise<Citizen[]> {
    try {
      if (!searchTerm.trim()) {
        return this.getAllCitizens()
      }

      const { data, error } = await supabase
        .from('citizens')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,surname.ilike.%${searchTerm}%,mobile_phone.ilike.%${searchTerm}%,landline_phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'αναζήτηση πολιτών')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'αναζήτηση πολιτών')
    }
  }

  async getCitizensStats(): Promise<{
    total: number
    active: number
    recent: number
  }> {
    try {
      // Total citizens
      const { count: total } = await supabase
        .from('citizens')
        .select('*', { count: 'exact', head: true })

      // Recent citizens (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { count: recent } = await supabase
        .from('citizens')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())

      return {
        total: total || 0,
        active: total || 0, // Assuming all are active unless you have a status field
        recent: recent || 0
      }
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση στατιστικών πολιτών')
    }
  }
}

export const citizensService = new CitizensService()
```

### 2.4 Requests Service

**`src/services/requestsService.ts`**
```typescript
import { BaseService } from './baseService'
import { supabase, Request } from '../lib/supabase'

export class RequestsService extends BaseService {
  constructor() {
    super('requests')
  }

  async getAllRequests(): Promise<Request[]> {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          citizens(name, surname),
          military_personnel(name, surname)
        `)
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση αιτημάτων')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση αιτημάτων')
    }
  }

  async getRequestsByCitizen(citizenId: string): Promise<Request[]> {
    try {
      this.validateId(citizenId)
      
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('citizen_id', citizenId)
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση αιτημάτων πολίτη')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση αιτημάτων πολίτη')
    }
  }

  async createRequest(requestData: Omit<Request, 'id' | 'created_at' | 'updated_at'>): Promise<Request> {
    try {
      const { data, error } = await supabase
        .from('requests')
        .insert([requestData])
        .select()
        .single()

      if (error) this.handleError(error, 'δημιουργία αιτήματος')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'δημιουργία αιτήματος')
    }
  }

  async updateRequest(id: string, requestData: Partial<Request>): Promise<Request> {
    try {
      this.validateId(id)
      
      const { data, error } = await supabase
        .from('requests')
        .update({ ...requestData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) this.handleError(error, 'ενημέρωση αιτήματος')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'ενημέρωση αιτήματος')
    }
  }

  async deleteRequest(id: string): Promise<void> {
    try {
      this.validateId(id)
      
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', id)

      if (error) this.handleError(error, 'διαγραφή αιτήματος')
    } catch (error) {
      this.handleError(error as Error, 'διαγραφή αιτήματος')
    }
  }

  async getRequestsStats(): Promise<{
    total: number
    pending: number
    completed: number
    rejected: number
  }> {
    try {
      const { data: requests, error } = await supabase
        .from('requests')
        .select('status')

      if (error) this.handleError(error, 'φόρτωση στατιστικών αιτημάτων')

      const stats = (requests || []).reduce((acc, req) => {
        acc.total++
        if (req.status === 'ΕΚΚΡΕΜΕΙ') acc.pending++
        else if (req.status === 'ΟΛΟΚΛΗΡΩΘΗΚΕ') acc.completed++
        else if (req.status === 'ΑΠΟΡΡΙΦΘΗΚΕ') acc.rejected++
        return acc
      }, { total: 0, pending: 0, completed: 0, rejected: 0 })

      return stats
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση στατιστικών αιτημάτων')
    }
  }
}

export const requestsService = new RequestsService()
```

### 2.5 Military Service

**`src/services/militaryService.ts`**
```typescript
import { BaseService } from './baseService'
import { supabase, MilitaryPersonnel } from '../lib/supabase'

export class MilitaryService extends BaseService {
  constructor() {
    super('military_personnel')
  }

  async getAllMilitaryPersonnel(): Promise<MilitaryPersonnel[]> {
    try {
      const { data, error } = await supabase
        .from('military_personnel')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση στρατιωτικού προσωπικού')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση στρατιωτικού προσωπικού')
    }
  }

  async getMilitaryPersonnelByEsso(essoYear: string, essoLetter?: string): Promise<MilitaryPersonnel[]> {
    try {
      let query = supabase
        .from('military_personnel')
        .select('*')
        .eq('esso_year', essoYear)

      if (essoLetter) {
        query = query.eq('esso_letter', essoLetter)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση ΕΣΣΟ')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση ΕΣΣΟ')
    }
  }

  async createMilitaryPersonnel(personnelData: Omit<MilitaryPersonnel, 'id' | 'created_at' | 'updated_at'>): Promise<MilitaryPersonnel> {
    try {
      const { data, error } = await supabase
        .from('military_personnel')
        .insert([personnelData])
        .select()
        .single()

      if (error) this.handleError(error, 'δημιουργία στρατιωτικού')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'δημιουργία στρατιωτικού')
    }
  }

  async updateMilitaryPersonnel(id: string, personnelData: Partial<MilitaryPersonnel>): Promise<MilitaryPersonnel> {
    try {
      this.validateId(id)
      
      const { data, error } = await supabase
        .from('military_personnel')
        .update({ ...personnelData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) this.handleError(error, 'ενημέρωση στρατιωτικού')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'ενημέρωση στρατιωτικού')
    }
  }

  async deleteMilitaryPersonnel(id: string): Promise<void> {
    try {
      this.validateId(id)
      
      const { error } = await supabase
        .from('military_personnel')
        .delete()
        .eq('id', id)

      if (error) this.handleError(error, 'διαγραφή στρατιωτικού')
    } catch (error) {
      this.handleError(error as Error, 'διαγραφή στρατιωτικού')
    }
  }

  async getMilitaryStats(): Promise<{
    total: number
    byYear: Record<string, number>
    byLetter: Record<string, number>
  }> {
    try {
      const { data: personnel, error } = await supabase
        .from('military_personnel')
        .select('esso_year, esso_letter')

      if (error) this.handleError(error, 'φόρτωση στατιστικών στρατιωτικών')

      const stats = (personnel || []).reduce((acc, person) => {
        acc.total++
        if (person.esso_year) {
          acc.byYear[person.esso_year] = (acc.byYear[person.esso_year] || 0) + 1
        }
        if (person.esso_letter) {
          acc.byLetter[person.esso_letter] = (acc.byLetter[person.esso_letter] || 0) + 1
        }
        return acc
      }, { total: 0, byYear: {} as Record<string, number>, byLetter: {} as Record<string, number> })

      return stats
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση στατιστικών στρατιωτικών')
    }
  }
}

export const militaryService = new MilitaryService()
```

---

## 🔄 ΒΗΜΑ 3: ΕΝΗΜΕΡΩΣΗ ZUSTAND STORES

### 3.1 Ενημέρωση Citizens Store

**Αντικαταστήστε το `src/stores/citizenStore.ts`:**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Citizen } from '../lib/supabase'
import { citizensService } from '../services/citizensService'

interface CitizenStore {
  citizens: Citizen[]
  isLoading: boolean
  error: string | null
  
  // Actions
  loadCitizens: () => Promise<void>
  addCitizen: (citizenData: Omit<Citizen, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateCitizen: (id: string, citizenData: Partial<Citizen>) => Promise<void>
  deleteCitizen: (id: string) => Promise<void>
  getCitizen: (id: string) => Citizen | undefined
  searchCitizens: (searchTerm: string) => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Computed
  getStats: () => Promise<{
    total: number
    active: number
    recent: number
  }>
}

export const useCitizenStore = create<CitizenStore>()(
  persist(
    (set, get) => ({
      citizens: [],
      isLoading: false,
      error: null,

      loadCitizens: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const citizens = await citizensService.getAllCitizens()
          set({ citizens, isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη φόρτωση πολιτών'
          })
        }
      },

      addCitizen: async (citizenData) => {
        set({ isLoading: true, error: null })
        
        try {
          const newCitizen = await citizensService.createCitizen(citizenData)
          set(state => ({
            citizens: [newCitizen, ...state.citizens],
            isLoading: false
          }))
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την προσθήκη πολίτη'
          })
          throw error
        }
      },

      updateCitizen: async (id, citizenData) => {
        set({ isLoading: true, error: null })
        
        try {
          const updatedCitizen = await citizensService.updateCitizen(id, citizenData)
          set(state => ({
            citizens: state.citizens.map(citizen =>
              citizen.id === id ? updatedCitizen : citizen
            ),
            isLoading: false
          }))
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την ενημέρωση πολίτη'
          })
          throw error
        }
      },

      deleteCitizen: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          await citizensService.deleteCitizen(id)
          set(state => ({
            citizens: state.citizens.filter(citizen => citizen.id !== id),
            isLoading: false
          }))
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη διαγραφή πολίτη'
          })
          throw error
        }
      },

      getCitizen: (id) => {
        return get().citizens.find(citizen => citizen.id === id)
      },

      searchCitizens: async (searchTerm) => {
        set({ isLoading: true, error: null })
        
        try {
          const citizens = await citizensService.searchCitizens(searchTerm)
          set({ citizens, isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την αναζήτηση'
          })
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),

      getStats: async () => {
        try {
          return await citizensService.getCitizensStats()
        } catch (error) {
          console.error('Σφάλμα στατιστικών:', error)
          return { total: 0, active: 0, recent: 0 }
        }
      }
    }),
    {
      name: 'citizen-storage',
      // Don't persist loading states and error states
      partialize: (state) => ({ citizens: state.citizens })
    }
  )
)
```

### 3.2 Παρόμοια ενημέρωση για τα άλλα stores

Θα χρειαστεί να ενημερώσετε με τον ίδιο τρόπο:
- `src/stores/requestStore.ts` 
- `src/stores/militaryStore.ts`
- `src/stores/reminderStore.ts`

---

## ⚡ ΒΗΜΑ 4: ΕΝΗΜΕΡΩΣΗ COMPONENTS

### 4.1 Αλλαγές στο Dashboard Component

**Στο `src/pages/Dashboard.tsx` αλλάξτε:**

```typescript
// Πριν (Mock data)
useEffect(() => {
  // No API calls needed
}, [])

// Μετά (Real data)
useEffect(() => {
  // Load real data on mount
  const loadData = async () => {
    await Promise.all([
      loadCitizens(),
      loadRequests(), 
      loadMilitaryPersonnel()
    ])
  }
  
  loadData()
}, [loadCitizens, loadRequests, loadMilitaryPersonnel])
```

### 4.2 Form Components Update

Τα forms θα συνεχίσουν να λειτουργούν όπως πριν, καθώς χρησιμοποιούν τις ίδιες store actions.

---

## 🔧 ΒΗΜΑ 5: ENVIRONMENT SETUP

### 5.1 Δημιουργήστε το `.env` αρχείο

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Development
VITE_NODE_ENV=development
```

### 5.2 Προσθέστε στο `.env.example`

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_NODE_ENV=development
```

---

## 🛡️ ΒΗΜΑ 6: ROW LEVEL SECURITY (RLS)

### 6.1 Ενεργοποίηση RLS για όλους τους πίνακες

```sql
-- Citizens
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all citizens" ON citizens
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert citizens" ON citizens
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update citizens" ON citizens
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete citizens" ON citizens
  FOR DELETE USING (auth.role() = 'authenticated');

-- Requests
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all requests" ON requests
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert requests" ON requests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update requests" ON requests
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete requests" ON requests
  FOR DELETE USING (auth.role() = 'authenticated');

-- Military Personnel
ALTER TABLE military_personnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all military personnel" ON military_personnel
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert military personnel" ON military_personnel
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update military personnel" ON military_personnel
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete military personnel" ON military_personnel
  FOR DELETE USING (auth.role() = 'authenticated');

-- Reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all reminders" ON reminders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert reminders" ON reminders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update reminders" ON reminders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete reminders" ON reminders
  FOR DELETE USING (auth.role() = 'authenticated');
```

---

## 🚀 ΒΗΜΑ 7: MIGRATION SCRIPT

### 7.1 Script για Migration από Mock Data

**`scripts/migrate-to-supabase.ts`**
```typescript
import { supabase } from '../src/lib/supabase'

// This script helps migrate any existing local data to Supabase
// Run only once during initial setup

async function migrateLocalDataToSupabase() {
  console.log('🚀 Ξεκίνημα migration στο Supabase...')

  try {
    // Clear existing data (optional - be careful!)
    console.log('🗑️ Καθαρισμός υπάρχοντων δεδομένων...')
    
    // Uncomment only if you want to clear existing data
    // await supabase.from('citizens').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    // await supabase.from('requests').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    // await supabase.from('military_personnel').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    console.log('✅ Migration ολοκληρώθηκε!')
    
  } catch (error) {
    console.error('❌ Σφάλμα κατά το migration:', error)
  }
}

// Run migration
migrateLocalDataToSupabase()
```

---

## 🧪 ΒΗΜΑ 8: TESTING INTEGRATION

### 8.1 Test Connection

**`src/utils/testSupabase.ts`**
```typescript
import { supabase } from '../lib/supabase'

export async function testSupabaseConnection() {
  try {
    console.log('🔗 Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('citizens')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Connection failed:', error)
      return false
    }
    
    console.log('✅ Connection successful!')
    console.log(`📊 Citizens count: ${data || 0}`)
    return true
    
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return false
  }
}

// Usage in component:
// import { testSupabaseConnection } from '../utils/testSupabase'
// testSupabaseConnection()
```

---

## 📋 ΒΗΜΑ 9: STEP-BY-STEP IMPLEMENTATION PLAN

### Phase 1: Infrastructure (Week 1)
- [ ] **Day 1**: Setup services layer
- [ ] **Day 2**: Update citizen store & test
- [ ] **Day 3**: Update requests store & test  
- [ ] **Day 4**: Update military store & test
- [ ] **Day 5**: Integration testing

### Phase 2: Components Integration (Week 2)
- [ ] **Day 1**: Update Dashboard page
- [ ] **Day 2**: Update Citizens page
- [ ] **Day 3**: Update Military pages
- [ ] **Day 4**: Update Reports integration
- [ ] **Day 5**: Full system testing

### Phase 3: Optimization & Polish (Week 3)
- [ ] **Day 1**: Performance optimization
- [ ] **Day 2**: Error handling improvement
- [ ] **Day 3**: Analytics real-data integration
- [ ] **Day 4**: Security review
- [ ] **Day 5**: Documentation & deployment

---

## ⚠️ ΣΗΜΑΝΤΙΚΕΣ ΣΗΜΕΙΩΣΕΙΣ

### 🔒 Ασφάλεια
- Βεβαιωθείτε ότι οι RLS policies είναι σωστά configured
- Μην commit τα .env files
- Χρησιμοποιήστε μόνο το anon key στο frontend

### 🔄 Data Sync
- Τα Zustand stores θα συγχρονίζονται με το Supabase
- Real-time subscriptions μπορούν να προστεθούν αργότερα
- Persist μόνο τα απαραίτητα δεδομένα locally

### 📊 Performance
- Χρησιμοποιήστε indexes για συχνές αναζητήσεις
- Implement pagination για μεγάλες λίστες
- Cache frequently accessed data

### 🐛 Error Handling
- Όλα τα services έχουν comprehensive error handling
- UI θα εμφανίζει user-friendly μηνύματα
- Fallback mechanisms για offline scenarios

---

## 🎯 ΕΠΟΜΕΝΑ ΒΗΜΑΤΑ

1. **Ξεκινήστε από το Service Layer** - Δημιουργήστε τα services
2. **Test σε Isolation** - Κάθε service ξεχωριστά
3. **Update Stores Σταδιακά** - Ένα-ένα τα stores
4. **Integration Testing** - Όλα μαζί
5. **Deploy & Monitor** - Production deployment

---

## 🆘 TROUBLESHOOTING

### Συχνά Προβλήματα:

**1. Connection Issues**
```bash
# Ελέγξτε τα environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

**2. RLS Policy Issues** 
```sql
-- Δείτε τα active policies
SELECT * FROM pg_policies WHERE tablename = 'citizens';
```

**3. CORS Issues**
- Ελέγξτε το domain στο Supabase dashboard
- Βεβαιωθείτε ότι το localhost είναι allowed

---

## 📞 SUPPORT

Για οποιαδήποτε ερώτηση ή πρόβλημα:
1. Ελέγξτε το Supabase dashboard για errors
2. Δείτε τα browser console logs
3. Ελέγξτε το network tab για failed requests

---

*Αυτός ο οδηγός σας δίνει όλα τα απαραίτητα εργαλεία για να μεταβείτε από mock data στην πραγματική Supabase βάση δεδομένων. Ακολουθήστε τα βήματα σταδιακά και δοκιμάστε κάθε τμήμα πριν προχωρήσετε στο επόμενο.*

🚀 **Καλή επιτυχία με την ενσωμάτωση!**