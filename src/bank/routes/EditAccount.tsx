import {
  accrueAccount,
  createPreset,
  getAccount,
  removeAccount,
  removePreset,
  updateAccount,
  updateAppearance,
  updatePreset,
} from "@bank/core/familyBank";
import { normalizeEmail } from "@bank/core/normalizeEmail";
import { Router } from "@bank/core/router";
import { ACCOUNT_APPEARANCE_SCHEMA, ACCOUNT_SCHEMA, TRANSACTION_SCHEMA } from "@bank/core/schemas";
import type { AccountDetail, Preset } from "@bank/core/types";
import { accountDetailSubscriptions, useLiveQuery } from "@bank/hooks/live";
import { useForm } from "@bank/hooks/useForm";
import { Button, ButtonLink } from "@bank/ui/Button";
import { ColorPicker } from "@bank/ui/ColorPicker";
import { EmojiPicker } from "@bank/ui/EmojiPicker";
import { Input } from "@bank/ui/Input";
import { Label } from "@bank/ui/Label";
import { SignedMoney } from "@bank/ui/Money";
import { PageTitle } from "@bank/ui/PageTitle";
import { Panel } from "@bank/ui/Panel";
import { DEFAULT_ACCOUNT_COLOR } from "@bank/utils/accountColor";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import * as v from "valibot";

const PRESET_FIELDS = v.pick(TRANSACTION_SCHEMA, ["note", "value"]);

interface Props {
  urlId: string;
}

export function EditAccount({ urlId }: Props) {
  const { data: account, reload } = useLiveQuery(() => getAccount(urlId), {
    key: urlId,
    subscribe: accountDetailSubscriptions(urlId),
  });

  if (!account) {
    return null;
  }

  const isParent = account.isParent;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageTitle>
          {account.emoji} {account.name}
        </PageTitle>
        <p className="text-muted-foreground font-semibold">
          {isParent ? "Account settings" : "Make it yours"}
        </p>
      </div>

      {isParent ? (
        <ParentDetailsForm account={account} urlId={urlId} />
      ) : (
        <AppearanceForm account={account} urlId={urlId} />
      )}

      <PresetEditor accountId={account._id} onChanged={reload} presets={account.presets} />

      {isParent && (
        <>
          <Panel description="Catch this account up to today at 4% APY." icon="✨" title="Interest">
            <Button
              className="self-start"
              onClick={() => void accrueAccount({ accountId: account._id }).then(reload)}
            >
              Pay interest now
            </Button>
          </Panel>

          <Panel description="Here be dragons." icon="⚠️" title="Delete account" tone="danger">
            <Button
              className="self-start"
              onClick={async () => {
                const input = prompt(
                  `Are you sure you want to delete this account? Type "${account.name}" to confirm.`,
                );
                if (input !== account.name) return;

                await removeAccount({ accountId: account._id });
                Router.push("BankAccountList");
              }}
              variant="destructive"
            >
              Delete {account.name}&rsquo;s account
            </Button>
          </Panel>
        </>
      )}
    </div>
  );
}

function ParentDetailsForm({
  account,
  urlId,
}: {
  account: Pick<AccountDetail, "_id" | "childEmail" | "color" | "emoji" | "name">;
  urlId: string;
}) {
  const { errors, handleSubmit } = useForm({
    async onSubmit({ data }) {
      const childEmail = normalizeEmail(data.childEmail);
      await updateAccount({ accountId: account._id, ...data, childEmail });
      Router.push("BankAccountDetails", { urlId });
    },
    schema: ACCOUNT_SCHEMA,
  });

  return (
    <Panel description="Who this account belongs to." icon="🧒" title="Details">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" required>
            Name
          </Label>
          <Input defaultValue={account.name} id="name" name="name" required />
        </div>

        <AppearanceFields defaultColor={account.color} defaultEmoji={account.emoji} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="childEmail">Kid&apos;s email</Label>
          <Input
            defaultValue={account.childEmail ?? ""}
            id="childEmail"
            name="childEmail"
            placeholder="kid@example.com"
            type="email"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit">Save</Button>

          <ButtonLink to={Router.BankAccountDetails({ urlId: account._id })} variant="outline">
            Cancel
          </ButtonLink>
        </div>

        {errors}
      </form>
    </Panel>
  );
}

function AppearanceForm({
  account,
  urlId,
}: {
  account: Pick<AccountDetail, "_id" | "color" | "emoji">;
  urlId: string;
}) {
  const { errors, handleSubmit } = useForm({
    async onSubmit({ data }) {
      await updateAppearance({ accountId: account._id, ...data });
      Router.push("BankAccountDetails", { urlId });
    },
    schema: ACCOUNT_APPEARANCE_SCHEMA,
  });

  return (
    <Panel description="Pick an emoji and a color for your avatar." icon="🎨" title="Look">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <AppearanceFields defaultColor={account.color} defaultEmoji={account.emoji} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit">Save</Button>

          <ButtonLink to={Router.BankAccountDetails({ urlId: account._id })} variant="outline">
            Cancel
          </ButtonLink>
        </div>

        {errors}
      </form>
    </Panel>
  );
}

function AppearanceFields({
  defaultColor,
  defaultEmoji,
}: {
  defaultColor?: string | undefined;
  defaultEmoji?: string | undefined;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="emoji">Emoji</Label>
        <EmojiPicker defaultValue={defaultEmoji} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Color</Label>
        <ColorPicker defaultValue={defaultColor ?? DEFAULT_ACCOUNT_COLOR} />
      </div>
    </>
  );
}

function PresetEditor({
  accountId,
  onChanged,
  presets,
}: {
  accountId: string;
  onChanged: () => void;
  presets: Pick<Preset, "_id" | "note" | "value">[];
}) {
  const { errors, handleSubmit } = useForm({
    async onSubmit({ data, form }) {
      form.reset();
      await createPreset({ accountId, ...data });
      onChanged();
    },
    schema: PRESET_FIELDS,
  });

  return (
    <Panel
      description="One-tap buttons on the account screen. Parents and kids share the same list."
      icon="⚡"
      title="Quick buttons"
    >
      {presets.length > 0 && (
        <ul className="flex flex-col gap-2">
          {presets.map((preset) => (
            <PresetRow key={preset._id} onChanged={onChanged} preset={preset} />
          ))}
        </ul>
      )}

      <form className="grid grid-cols-[1fr_6rem] gap-3" onSubmit={handleSubmit}>
        <Input aria-label="Note (required)" name="note" placeholder="Note" required type="text" />
        <Input
          aria-label="Value (required)"
          className="text-right"
          name="value"
          placeholder="0"
          required
          step={0.01}
          type="number"
        />
        <Button className="col-span-2" type="submit">
          Add quick button
        </Button>
      </form>
      {errors}
    </Panel>
  );
}

function PresetRow({
  onChanged,
  preset,
}: {
  onChanged: () => void;
  preset: Pick<Preset, "_id" | "note" | "value">;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <PresetEditForm onChanged={onChanged} onDone={() => setEditing(false)} preset={preset} />
    );
  }

  return (
    <li className="bg-secondary flex items-center gap-3 rounded-md py-2 pr-2 pl-3">
      <span className="grow font-bold">{preset.note}</span>
      <SignedMoney value={preset.value} />
      <Button
        aria-label={`Edit ${preset.note}`}
        className="text-muted-foreground size-9"
        onClick={() => setEditing(true)}
        size="icon"
        variant="ghost"
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        aria-label={`Delete ${preset.note}`}
        className="text-muted-foreground size-9"
        onClick={() => void removePreset({ presetId: preset._id }).then(onChanged)}
        size="icon"
        variant="ghost"
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}

function PresetEditForm({
  onChanged,
  onDone,
  preset,
}: {
  onChanged: () => void;
  onDone: () => void;
  preset: Pick<Preset, "_id" | "note" | "value">;
}) {
  const { errors, handleSubmit } = useForm({
    async onSubmit({ data }) {
      await updatePreset({ presetId: preset._id, ...data });
      onChanged();
      onDone();
    },
    schema: PRESET_FIELDS,
  });

  return (
    <li className="bg-secondary rounded-md p-3">
      <form className="grid grid-cols-[1fr_6rem] gap-3" onSubmit={handleSubmit}>
        <Input
          aria-label="Note (required)"
          defaultValue={preset.note}
          name="note"
          required
          type="text"
        />
        <Input
          aria-label="Value (required)"
          className="text-right"
          defaultValue={(preset.value / 100).toFixed(2)}
          name="value"
          required
          step={0.01}
          type="number"
        />
        <div className="col-span-2 flex gap-2">
          <Button type="submit">Save</Button>
          <Button onClick={onDone} type="button" variant="outline">
            Cancel
          </Button>
        </div>
        {errors}
      </form>
    </li>
  );
}
