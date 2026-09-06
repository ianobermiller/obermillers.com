import { removeTransaction, updateTransaction } from "@bank/core/familyBank";
import type { Transaction } from "@bank/core/types";
import { useBreakpoint } from "@bank/hooks/useBreakpoint";
import { useForm } from "@bank/hooks/useForm";
import { Button } from "@bank/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@bank/ui/Dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@bank/ui/Drawer";
import { Input } from "@bank/ui/Input";
import { Label } from "@bank/ui/Label";
import { MoreVertical } from "lucide-react";
import { useState } from "react";

import { TRANSACTION_SCHEMA } from "../core/schemas";

interface Props {
  onChanged?: () => void;
  transaction: Transaction;
}

export function EditTransaction({ onChanged, transaction }: Props) {
  const [open, setOpen] = useState(false);
  const isDesktop = useBreakpoint("md");

  const Root = isDesktop ? Dialog : Drawer;
  const Trigger = isDesktop ? DialogTrigger : DrawerTrigger;
  const Content = isDesktop ? DialogContent : DrawerContent;
  const Header = isDesktop ? DialogHeader : DrawerHeader;
  const Title = isDesktop ? DialogTitle : DrawerTitle;
  const footer = isDesktop ? null : (
    <DrawerFooter className="pt-0">
      <DrawerClose asChild>
        <Button variant="outline">Cancel</Button>
      </DrawerClose>
    </DrawerFooter>
  );

  const { errors, handleSubmit } = useForm({
    async onSubmit({ data }) {
      await updateTransaction({
        isFromParent: true,
        note: data.note,
        timestamp: data.timestamp,
        transactionId: transaction._id,
        value: data.value,
      });
      onChanged?.();
      setOpen(false);
    },
    schema: TRANSACTION_SCHEMA,
  });

  async function handleDelete() {
    await removeTransaction({ transactionId: transaction._id });
    onChanged?.();
    setOpen(false);
  }

  const dateString = new Date(transaction.timestamp).toISOString().split("T")[0];

  return (
    <Root onOpenChange={setOpen} open={open}>
      <Trigger asChild>
        <Button size="icon" variant="ghost">
          <MoreVertical />
        </Button>
      </Trigger>

      <Content className="sm:max-w-md">
        <Header>
          <Title>Edit transaction</Title>
        </Header>

        <form className="m-4 grid items-start gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="value" required>
              Value
            </Label>
            <Input
              defaultValue={(transaction.value / 100).toFixed(2)}
              id="value"
              name="value"
              required
              step={0.01}
              type="number"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note" required>
              Note
            </Label>
            <Input defaultValue={transaction.note} id="note" name="note" required type="text" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="timestamp" required>
              Date
            </Label>
            <Input defaultValue={dateString} id="timestamp" name="timestamp" required type="date" />
          </div>
          {errors}
          <Button type="submit">Save changes</Button>
          <Button onClick={handleDelete} variant="destructive">
            Delete
          </Button>
        </form>

        {footer}
      </Content>
    </Root>
  );
}
