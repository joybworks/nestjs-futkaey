import { RepositoryMixin } from '@joyb-works/nestjs-futkaey';
import { Injectable } from '@nestjs/common';
import { CardEntity } from './card.entity';
import { CardModel } from './card.model';

const Base = RepositoryMixin(CardEntity, CardModel);

@Injectable()
export class CardRepository extends Base {}
