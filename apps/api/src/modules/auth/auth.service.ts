import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  login(): never {
    throw new NotImplementedException('Login flow will be implemented in S1-004');
  }

  refresh(): never {
    throw new NotImplementedException(
      'Refresh flow will be implemented in S1-004',
    );
  }

  logout(): never {
    throw new NotImplementedException(
      'Logout flow will be implemented in S1-004',
    );
  }

  logoutAll(): never {
    throw new NotImplementedException(
      'Logout-all flow will be implemented in S1-004',
    );
  }

  me(): never {
    throw new NotImplementedException('Me endpoint will be implemented in S1-004');
  }
}
