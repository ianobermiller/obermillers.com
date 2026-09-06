import { createAccount } from "@bank/core/familyBank";
import { normalizeEmail } from "@bank/core/normalizeEmail";
import { Router } from "@bank/core/router";
import { ACCOUNT_SCHEMA } from "@bank/core/schemas";
import { useAccountAccess } from "@bank/hooks/auth";
import { useForm } from "@bank/hooks/useForm";
import { Button } from "@bank/ui/Button";
import { ColorPicker } from "@bank/ui/ColorPicker";
import { EmojiPicker } from "@bank/ui/EmojiPicker";
import { Input } from "@bank/ui/Input";
import { Label } from "@bank/ui/Label";
import { PageTitle } from "@bank/ui/PageTitle";
import { Panel } from "@bank/ui/Panel";
import { DEFAULT_ACCOUNT_COLOR } from "@bank/utils/accountColor";

export function NewAccount() {
  const { canCreate, isLoading, refreshSession } = useAccountAccess();
  const { errors, handleSubmit } = useForm({
    async onSubmit({ data }) {
      const childEmail = normalizeEmail(data.childEmail);
      const accountId = await createAccount({ ...data, childEmail });
      await refreshSession();
      Router.push("BankAccountDetails", { urlId: accountId });
    },
    schema: ACCOUNT_SCHEMA,
  });

  if (!isLoading && !canCreate) {
    Router.push("BankAccountList");
    return null;
  }

  if (isLoading) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageTitle>New account</PageTitle>
        <p className="text-muted-foreground font-semibold">Who are we saving for?</p>
      </div>

      <Panel description="You can change any of this later." icon="🧒" title="Details">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" required>
              Name
            </Label>
            <Input id="name" name="name" placeholder="Maya" required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="emoji">Emoji</Label>
            <EmojiPicker />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Color</Label>
            <ColorPicker defaultValue={DEFAULT_ACCOUNT_COLOR} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="childEmail">Kid&apos;s email</Label>
            <Input id="childEmail" name="childEmail" placeholder="kid@example.com" type="email" />
            <p className="text-muted-foreground text-sm font-semibold">
              They&apos;ll use this to sign in and see their own balance.
            </p>
          </div>

          <Button className="self-start" type="submit">
            Create account
          </Button>

          {errors}
        </form>
      </Panel>
    </div>
  );
}
