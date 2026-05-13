import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { SHG } from './shg.entity';

@Entity('bank_details')
export class BankDetails {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => SHG, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shg_id' })
  shg!: SHG;

  @Column({ type: 'int', name: 'shg_id' })
  shgId!: number;

  @Column({ type: 'varchar', name: 'account_holder_name' })
  accountHolderName!: string;

  @Column({ type: 'varchar', name: 'account_number' })
  accountNumber!: string;

  @Column({ type: 'varchar', name: 'bank_name' })
  bankName!: string;

  @Column({ type: 'varchar', name: 'branch_name' })
  branchName!: string;

  @Column({ type: 'varchar', name: 'ifsc_code', length: 11 })
  ifscCode!: string;
}
