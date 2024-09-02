import fs from "fs";

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlipRadar } from "../target/types/blip_radar";

export function loadPrivateKeyFromUint8String(
  prikey: string
): anchor.web3.Keypair {
  const privateKey = JSON.parse(prikey);
  return anchor.web3.Keypair.fromSecretKey(Uint8Array.from(privateKey));
}

export function loadAuthorityWallet(): anchor.web3.Keypair {
  const authorityPath = process.env.AUTHORITY_WALLET_RELATIVE_PATH;
  if (!authorityPath) {
    throw new Error("define AUTHORITY_WALLET_RELATIVE_PATH in env");
  }

  const keyFile = fs.readFileSync(authorityPath, "utf-8");
  return loadPrivateKeyFromUint8String(keyFile);
}

describe("blip-radar", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const conn = new anchor.web3.Connection(
    "https://staging-rpc.dev2.eclipsenetwork.xyz",
    "finalized"
  );
  const payer = new anchor.web3.Keypair();
  anchor.setProvider(new anchor.AnchorProvider(conn, new anchor.Wallet(payer)));

  const program = anchor.workspace.BlipRadar as Program<BlipRadar>;

  it("Is initialized!", async () => {
    const asset = anchor.web3.Keypair.generate();

    const feeAccount = new anchor.web3.PublicKey(
      "6juCmFHoPnJTzhjJfcjFhCXeptCE89vp9dHP91EUaxR8"
    );

    const receiverAccount = anchor.web3.Keypair.generate();

    const authority = loadAuthorityWallet();
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
    const [blipCounterPda, _] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("blip_counter"), payer.publicKey.toBuffer()],
      program.programId
    );
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
        collection: new anchor.web3.PublicKey(
          "HZp57kjtHqxptkn5KL4nJsZV5LYvGWb2oteGtB3t93wy"
        ),
        collectionAuthority: authority.publicKey,
        systemProgram: new anchor.web3.PublicKey(
          "11111111111111111111111111111111"
        ),
        blipCounter: blipCounterPda,
      })
      .signers([asset, payer, authority])
      .rpc();
    await conn.confirmTransaction(tx);
    const counter = await program.account.blipCounter.fetch(blipCounterPda);
    console.log('Counter PDA', counter.count, JSON.stringify(counter, null, 2))
    console.log("Your transaction signature", tx);
  });
});
