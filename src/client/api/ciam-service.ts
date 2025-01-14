import {
  AuthenticatedUser,
  License,
  LicenseService,
  TokenFunction,
  User,
  header,
} from '../service';
import {
  licenseServiceGetLicense,
  licenseServiceGetSeats,
  licenseServiceModifySeats,
} from './ciam-authz';

export class CiamAuthz implements LicenseService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || '';
  }

  async get({ orgId, serviceId, token }: AuthenticatedUser): Promise<License> {
    const opts = await this.requestHeader(token);
    const result = await licenseServiceGetLicense(orgId, serviceId, opts);
    return {
      available: Number(result.seatsAvailable) || 0,
      total: Number(result.seatsTotal) || 0,
    };
  }

  async seats(
    { orgId, serviceId, token }: AuthenticatedUser,
    assigned: boolean | undefined = true
  ): Promise<User[]> {
    const opts = await this.requestHeader(token);
    const result = await licenseServiceGetSeats(
      orgId,
      serviceId,
      { filter: assigned ? 'assigned' : 'assignable' },
      opts
    );
    return (
      result.users?.map(({ id, firstName, lastName, username, assigned }) => ({
        id: id || '',
        firstName: firstName || '',
        lastName: lastName || '',
        userName: username || '',
        assigned: !!assigned,
      })) || []
    );
  }

  private async requestHeader(token: TokenFunction) {
    return await header(token, this.baseUrl);
  }

  async assign(user: AuthenticatedUser, userIds: string[]): Promise<void> {
    const body = { assign: userIds };
    await this.modify(user, body);
    return;
  }

  async unAssign(user: AuthenticatedUser, userIds: string[]): Promise<void> {
    const body = { unassign: userIds };
    await this.modify(user, body);
    return;
  }

  private async modify(
    { orgId, serviceId, token }: AuthenticatedUser,
    body: any
  ): Promise<any> {
    const opts = await this.requestHeader(token);
    return licenseServiceModifySeats(orgId, serviceId, body, opts);
  }
}
