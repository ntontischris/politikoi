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

  protected validateRequired(data: Record<string, any>, fields: string[]): void {
    for (const field of fields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        throw new Error(`Το πεδίο ${field} είναι υποχρεωτικό`)
      }
    }
  }
}