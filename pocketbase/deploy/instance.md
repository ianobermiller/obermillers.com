# Oracle Cloud instance

| Field | Value |
|-------|-------|
| Region | `us-ashburn-1` (IAD) |
| Image | Oracle Linux 9.8 (aarch64) |
| Shape | `VM.Standard.A1.Flex` — 1 OCPU, 6 GB RAM |
| Public IPv4 | `129.213.88.91` |
| Hostname | `pb.obermillers.com` |
| OCID | `ocid1.instance.oc1.iad.anuwcljrmx4zyrac7wmpgfyslrp3t35gt7xkig2mdsemsf6cof6ext2k7y7q` |
| SSH user | `opc` (not `ubuntu`) |
| SSH key | `~/.ssh/oracle-pocketbase` |

## SSH

```bash
ssh -i ~/.ssh/oracle-pocketbase opc@129.213.88.91
```

## DNS

A record `pb.obermillers.com` → `129.213.88.91` (confirmed).

## TLS

Let’s Encrypt cert for `pb.obermillers.com` is issued. HTTP redirects to HTTPS. Admin UI: https://pb.obermillers.com/_/
