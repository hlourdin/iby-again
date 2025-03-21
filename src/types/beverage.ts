export interface BeverageType {
  id: string;
  name: string;
}

export interface Beverage {
  id?: string;
  owedBy: string;
  owedTo: string;
  beverageName: string;
  reason?: string;
  date: Date;
  isPaid: boolean;
} 