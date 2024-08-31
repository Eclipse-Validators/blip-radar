import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlipRadar } from "../target/types/blip_radar";

describe("blip-radar", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const conn = new anchor.web3.Connection(
    "https://staging-rpc.dev2.eclipsenetwork.xyz",
    "finalized"
  );
  const payer = new anchor.web3.Keypair();
  anchor.setProvider(new anchor.AnchorProvider(conn, new anchor.Wallet(payer)));

  console.log(anchor.getProvider());

  const program = anchor.workspace.BlipRadar as Program<BlipRadar>;

  it("Is initialized!", async () => {
    const asset = anchor.web3.Keypair.generate();

    const feeAccount = new anchor.web3.PublicKey(
      "6juCmFHoPnJTzhjJfcjFhCXeptCE89vp9dHP91EUaxR8"
    );

    const receiverAccount = anchor.web3.Keypair.generate();

    const receiverSig = await conn.requestAirdrop(
      receiverAccount.publicKey,
      1_000_000 * 1
    );
    const payerSig = await conn.requestAirdrop(
      payer.publicKey,
      1_000_000_000 * 1
    );

    console.log("payer", payer.publicKey);
    console.log("reciever", receiverAccount.publicKey);

    await conn.confirmTransaction(receiverSig);
    await conn.confirmTransaction(payerSig);

    const tx = await program.methods
      .sendBlip(
        "https://arweave.net/8FDIo_3e5EJBx_1Nq9tdeZ1XZHN2_3GDomncAYKw1jM"
      )
      .accountsPartial({
        asset: asset.publicKey,
        payer: payer.publicKey,
        receiver: receiverAccount.publicKey,
        feeDestination: feeAccount,
        mplCoreProgram: new anchor.web3.PublicKey(
          "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
        ),
        systemProgram: new anchor.web3.PublicKey(
          "11111111111111111111111111111111"
        ),
      })
      .signers([asset, payer])
      .rpc();
    console.log("Your transaction signature", tx);
  });
});
