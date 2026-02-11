import { RepositoryMixin } from '@joyb-works/nestjs-futkaey';
import { Injectable } from '@nestjs/common';
import { LookupEntity } from './lookup.entity';
import { LookupModel } from './lookup.model';

const Base = RepositoryMixin(LookupEntity, LookupModel);

@Injectable()
export class LookupRepository extends Base { }
