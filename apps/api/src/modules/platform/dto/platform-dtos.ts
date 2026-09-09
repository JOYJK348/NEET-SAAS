import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsNotEmpty()
  adminFirstName!: string;

  @IsString()
  @IsNotEmpty()
  adminLastName!: string;

  @IsEmail()
  @IsNotEmpty()
  adminEmail!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  initialFeatures?: string[];
}

export class UpdateTenantStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status!: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

  @IsString()
  @IsOptional()
  reason?: string;
}

export class InviteTenantAdminDto {
  @IsString()
  @IsNotEmpty()
  adminFirstName!: string;

  @IsString()
  @IsNotEmpty()
  adminLastName!: string;

  @IsEmail()
  @IsNotEmpty()
  adminEmail!: string;
}

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];
}

export class ToggleFeatureFlagDto {
  @IsString()
  @IsNotEmpty()
  featureKey!: string;

  @IsBoolean()
  enabled!: boolean;
}
