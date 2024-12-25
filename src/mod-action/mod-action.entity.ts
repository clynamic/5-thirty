import { ModAction, ModActionAction } from 'src/api';
import { CacheEntity, CacheLink, ItemType } from 'src/cache/cache.entity';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('mod_actions')
@Index(['action', 'createdAt'])
export class ModActionEntity extends CacheLink {
  constructor(partial: Partial<ModActionEntity>) {
    super();
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  creatorId: number;

  @Column({ type: 'datetime' })
  createdAt: Date;

  @Column({ type: 'datetime' })
  updatedAt: Date;

  // We intentionally use a text instead of an enum here, because mod actions can be added or removed over time.
  // We do not want a future sync to fail on insertion because of restrictive checks.
  @Column({ type: 'text' })
  action: ModActionAction;

  @Column({ type: 'json' })
  values: Record<string, unknown>;
}

export class ModActionCacheEntity extends CacheEntity {
  constructor(value: ModAction) {
    super({
      id: `/${ItemType.modActions}/${value.id}`,
      value,
    });
  }
}
