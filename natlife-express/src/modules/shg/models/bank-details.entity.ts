import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { SHG } from './shg.entity';

@Entity('bank_details')
export class BankDetails {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => SHG, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shg_id' })
  shg!: SHG;

  @Column({ name: 'shg_id' })
  shgId!: number;

  @Column({ name: 'account_holder_name' })
  accountHolderName!: string;

  @Column({ name: 'account_number' })
  accountNumber!: string;

  @Column({ name: 'bank_name' })
  bankName!: string;

  @Column({ name: 'branch_name' })
  branchName!: string;

  @Column({ name: 'ifsc_code', length: 11 })
  ifscCode!: string;
}
