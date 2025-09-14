import { ModAction, ModActionAction } from 'src/api';
import { ItemType, LabelEntity, LabelLink } from 'src/label/label.entity';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity(ItemType.modActions)
@Index(['action', 'createdAt'])
export class ModActionEntity extends LabelLink {
  constructor(partial: Partial<ModActionEntity>) {
    super();
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  creatorId: number;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  updatedAt: Date;

  // We intentionally use a text instead of an enum here, because mod actions can be added or removed over time.
  // We do not want a future sync to fail on insertion because of restrictive checks.
  @Column({ type: 'text' })
  action: ModActionAction;

  @Column({ type: 'json' })
  values: Record<string, unknown>;
}

export class ModActionLabelEntity extends LabelEntity {
  constructor(value: ModAction) {
    super({
      id: `/${ItemType.modActions}/${value.id}`,
    });
  }
}
