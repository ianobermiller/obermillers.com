import { useBreakpoint } from "@bank/hooks/useBreakpoint";
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
import { filterAccountEmojis } from "@bank/utils/accountEmojis";
import { cn } from "@bank/utils/cn";
import { useMemo, useState } from "react";

interface Props {
  defaultValue?: string;
  id?: string;
  name?: string;
}

export function EmojiPicker({ defaultValue = "", id = "emoji", name = "emoji" }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isDesktop = useBreakpoint("md");
  const matches = useMemo(() => filterAccountEmojis(query), [query]);

  const Root = isDesktop ? Dialog : Drawer;
  const Trigger = isDesktop ? DialogTrigger : DrawerTrigger;
  const Content = isDesktop ? DialogContent : DrawerContent;
  const Header = isDesktop ? DialogHeader : DrawerHeader;
  const Title = isDesktop ? DialogTitle : DrawerTitle;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  function pick(emoji: string) {
    setValue(emoji);
    setOpen(false);
    setQuery("");
  }

  const picker = (
    <>
      <Header>
        <Title>Pick an emoji</Title>
      </Header>

      <div className="flex flex-col gap-3 px-4 pb-2 sm:px-0 sm:pb-0">
        <Input
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Search — dog, rocket, pizza…"
          type="search"
          value={query}
        />

        {matches.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm font-semibold">
            Nothing matches. Type one in the box instead.
          </p>
        ) : (
          <div className="grid max-h-64 grid-cols-6 gap-2 overflow-y-auto sm:grid-cols-8">
            {matches.map((item) => (
              <button
                aria-label={item.keywords[0]}
                className={cn(
                  "grid aspect-square place-items-center rounded-lg text-2xl hover:bg-accent",
                  value === item.emoji && "bg-brand-soft ring-2 ring-ring",
                )}
                key={item.emoji}
                onClick={() => pick(item.emoji)}
                type="button"
              >
                {item.emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {!isDesktop && (
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      )}
    </>
  );

  return (
    <div className="flex items-center gap-3">
      <Root onOpenChange={handleOpenChange} open={open}>
        <Trigger asChild>
          <button
            aria-label="Open emoji picker"
            className="press border-border bg-card shadow-card hover:border-brand/50 grid size-14 shrink-0 place-items-center rounded-xl border-2 text-3xl"
            type="button"
          >
            {value || "🙂"}
          </button>
        </Trigger>
        <Content className="sm:max-w-md">{picker}</Content>
      </Root>

      <Input
        className="w-24 text-center text-xl"
        id={id}
        name={name}
        onChange={(event) => setValue(event.currentTarget.value)}
        placeholder="🦄"
        type="text"
        value={value}
      />
    </div>
  );
}
