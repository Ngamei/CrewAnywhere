import { BaseRepository } from '@/backend/repositories/base-repository';
import type {
  BusinessFinanceRecord,
  CompanyProfileRecord,
  KybRecord,
} from '@/modules/profiles/types/profile-records';
import type { CreateCompanyProfileInput, UpdateCompanyFinanceInput, UpdateCompanyProfileInput } from '@/modules/profiles/schemas';
import type { ProfileRepositoryClients } from './profile-repository-clients';

const COMPANY_COLUMNS =
  'id, owner_business_user_id, company_name, legal_name, registration_number, website_url, description, country_code, status, business_ready, verified_business, created_at, updated_at, deleted_at';

const FINANCE_COLUMNS =
  'id, company_profile_id, billing_email, tax_identifier, tax_country_code, default_currency, payment_setup_completed, tax_setup_completed, created_at, updated_at, deleted_at';

const KYB_COLUMNS =
  'id, company_profile_id, status, status_version, provider, provider_reference, submitted_at, approved_at, rejected_reason, metadata, created_at, updated_at, deleted_at';

export class CompanyProfileRepository extends BaseRepository {
  constructor(private readonly clients: ProfileRepositoryClients) {
    super(clients.read);
  }

  async findById(id: string): Promise<CompanyProfileRecord | null> {
    const { data, error } = await this.clients.read
      .from('company_profiles')
      .select(COMPANY_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as CompanyProfileRecord | null;
  }

  async listByOwnerBusinessUserId(ownerBusinessUserId: string): Promise<CompanyProfileRecord[]> {
    const { data, error } = await this.clients.read
      .from('company_profiles')
      .select(COMPANY_COLUMNS)
      .eq('owner_business_user_id', ownerBusinessUserId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as CompanyProfileRecord[];
  }

  async findFinanceByCompanyId(companyProfileId: string): Promise<BusinessFinanceRecord | null> {
    const { data, error } = await this.clients.read
      .from('business_finance_records')
      .select(FINANCE_COLUMNS)
      .eq('company_profile_id', companyProfileId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as BusinessFinanceRecord | null;
  }

  async findLatestKybByCompanyId(companyProfileId: string): Promise<KybRecord | null> {
    const { data, error } = await this.clients.read
      .from('kyb_records')
      .select(KYB_COLUMNS)
      .eq('company_profile_id', companyProfileId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as KybRecord | null;
  }

  async createForOwner(
    ownerBusinessUserId: string,
    input: CreateCompanyProfileInput,
  ): Promise<CompanyProfileRecord> {
    const { data, error } = await this.clients.write
      .from('company_profiles')
      .insert({
        owner_business_user_id: ownerBusinessUserId,
        company_name: input.companyName,
        legal_name: input.legalName ?? null,
        registration_number: input.registrationNumber ?? null,
        website_url: input.websiteUrl ?? null,
        description: input.description ?? null,
        country_code: input.countryCode ?? null,
        status: 'draft',
      })
      .select(COMPANY_COLUMNS)
      .single();

    if (error) throw error;

    const profile = data as CompanyProfileRecord;

    const { error: financeError } = await this.clients.write.from('business_finance_records').insert({
      company_profile_id: profile.id,
    });

    if (financeError) throw financeError;

    return profile;
  }

  async updateProfile(
    companyProfileId: string,
    input: UpdateCompanyProfileInput,
  ): Promise<CompanyProfileRecord> {
    const patch: Record<string, unknown> = {};

    if (input.companyName !== undefined) patch.company_name = input.companyName;
    if (input.legalName !== undefined) patch.legal_name = input.legalName;
    if (input.registrationNumber !== undefined) patch.registration_number = input.registrationNumber;
    if (input.websiteUrl !== undefined) patch.website_url = input.websiteUrl;
    if (input.description !== undefined) patch.description = input.description;
    if (input.countryCode !== undefined) patch.country_code = input.countryCode;

    const { data, error } = await this.clients.write
      .from('company_profiles')
      .update(patch)
      .eq('id', companyProfileId)
      .is('deleted_at', null)
      .select(COMPANY_COLUMNS)
      .single();

    if (error) throw error;
    return data as CompanyProfileRecord;
  }

  async updateFinance(
    companyProfileId: string,
    input: UpdateCompanyFinanceInput,
  ): Promise<BusinessFinanceRecord> {
    const patch: Record<string, unknown> = {};

    if (input.billingEmail !== undefined) patch.billing_email = input.billingEmail;
    if (input.taxIdentifier !== undefined) patch.tax_identifier = input.taxIdentifier;
    if (input.taxCountryCode !== undefined) patch.tax_country_code = input.taxCountryCode;
    if (input.defaultCurrency !== undefined) patch.default_currency = input.defaultCurrency;
    if (input.paymentSetupCompleted !== undefined) {
      patch.payment_setup_completed = input.paymentSetupCompleted;
    }
    if (input.taxSetupCompleted !== undefined) patch.tax_setup_completed = input.taxSetupCompleted;

    const { data, error } = await this.clients.write
      .from('business_finance_records')
      .update(patch)
      .eq('company_profile_id', companyProfileId)
      .is('deleted_at', null)
      .select(FINANCE_COLUMNS)
      .single();

    if (error) throw error;
    return data as BusinessFinanceRecord;
  }

  async syncBusinessReadyFlag(companyProfileId: string, businessReady: boolean): Promise<void> {
    const { error } = await this.clients.write
      .from('company_profiles')
      .update({ business_ready: businessReady })
      .eq('id', companyProfileId)
      .is('deleted_at', null);

    if (error) throw error;
  }
}
