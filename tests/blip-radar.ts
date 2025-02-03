import fs from "fs";

import { expect } from "chai";

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlipRadar } from "../target/types/blip_radar";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

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

const requestAirdrop = async (
  connection: Connection,
  address: PublicKey,
  amount: number = 10 * LAMPORTS_PER_SOL
) => {
  const airdropSig = await connection.requestAirdrop(address, amount);
  await connection.confirmTransaction(airdropSig);
};

describe("blip-radar", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.BlipRadar as Program<BlipRadar>;
  const authority = loadAuthorityWallet();

  // const program = anchor.workspace.BlipRadar as Program<BlipRadar>;

  // it("Is initialized!", async () => {
  //   const asset = anchor.web3.Keypair.generate();

  //   const feeAccount = new anchor.web3.PublicKey(
  //     "6juCmFHoPnJTzhjJfcjFhCXeptCE89vp9dHP91EUaxR8"
  //   );

  //   const receiverAccount = anchor.web3.Keypair.generate();

  //   const authority = loadAuthorityWallet();
  //   const receiverSig = await conn.requestAirdrop(
  //     receiverAccount.publicKey,
  //     1_000_000 * 1
  //   );
  //   const payerSig = await conn.requestAirdrop(
  //     payer.publicKey,
  //     1_000_000_000 * 1
  //   );

  //   console.log("payer", payer.publicKey);
  //   console.log("reciever", receiverAccount.publicKey);

  //   await conn.confirmTransaction(receiverSig);
  //   await conn.confirmTransaction(payerSig);

  //   const tx = await program.methods
  //     .sendBlip(
  //       "https://arweave.net/8FDIo_3e5EJBx_1Nq9tdeZ1XZHN2_3GDomncAYKw1jM"
  //     )
  //     .accountsPartial({
  //       asset: asset.publicKey,
  //       payer: payer.publicKey,
  //       receiver: receiverAccount.publicKey,
  //       feeDestination: feeAccount,
  //       mplCoreProgram: new anchor.web3.PublicKey(
  //         "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
  //       ),
  //       collection: new anchor.web3.PublicKey(
  //         "HZp57kjtHqxptkn5KL4nJsZV5LYvGWb2oteGtB3t93wy"
  //       ),
  //       collectionAuthority: authority.publicKey,
  //       systemProgram: new anchor.web3.PublicKey(
  //         "11111111111111111111111111111111"
  //       ),
  //     })
  //     .signers([asset, payer, authority])
  //     .rpc();
  //   console.log("Your transaction signature", tx);
  // });
  describe("init_config", () => {
    before(async () => {
      await requestAirdrop(program.provider.connection, authority.publicKey);
    });

    it("fails when fee shares exceed maximum allowed", async () => {
      const feeShares = Array(6).fill({
        basisPoints: 1000,
        destination: anchor.web3.Keypair.generate().publicKey,
      });

      const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      try {
        await program.methods
          .initConfig(new anchor.BN(100000), feeShares)
          .accounts({
            authority: authority.publicKey,
            config: configPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        expect.fail("Should have failed with too many fee shares");
      } catch (err) {
        expect(err.message).to.include("TooManyFeeShares");
      }
    });

    it("fails when total basis points exceed 10000", async () => {
      const feeShares = [
        {
          basisPoints: 6000, // 60%
          destination: anchor.web3.Keypair.generate().publicKey,
        },
        {
          basisPoints: 5000, // 50%
          destination: anchor.web3.Keypair.generate().publicKey,
        },
      ];

      const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      try {
        await program.methods
          .initConfig(new anchor.BN(100000), feeShares)
          .accounts({
            authority: authority.publicKey,
            config: configPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        expect.fail("Should have failed with invalid basis points");
      } catch (err) {
        expect(err.message).to.include("InvalidFeeBasisPoints");
      }
    });

    it("fails when called by non-admin authority", async () => {
      const nonAdmin = anchor.web3.Keypair.generate();
      const feeShares = [
        {
          basisPoints: 5000,
          destination: anchor.web3.Keypair.generate().publicKey,
        },
      ];

      const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      try {
        await program.methods
          .initConfig(new anchor.BN(100000), feeShares)
          .accounts({
            authority: nonAdmin.publicKey,
            config: configPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([nonAdmin])
          .rpc();
        expect.fail("Should have failed with incorrect authority");
      } catch (err) {
        console.log(err);
        expect(err.message).to.include("IncorrectAuthority");
      }
    });

    // NOTE: this must be the last test because the other failure tests will
    // cause anchor to error trying to initialize an account that already exists
    it("successfully initializes config with valid fee shares", async () => {
      const feeDestination1 = anchor.web3.Keypair.generate();
      const feeDestination2 = anchor.web3.Keypair.generate();

      const feeShares = [
        {
          basisPoints: 6_000, // 60%
          destination: feeDestination1.publicKey,
        },
        {
          basisPoints: 4_000, // 40%
          destination: feeDestination2.publicKey,
        },
      ];

      const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      await program.methods
        .initConfig(new anchor.BN(100_000), feeShares) // .001
        .accounts({
          authority: authority.publicKey,
          config: configPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc({
          skipPreflight: true,
        });

      const config = await program.account.blipConfig.fetch(configPda);
      expect(config.feeLamports.toString()).to.equal("100000");
      expect(config.feeShares).to.have.length(2);
      expect(config.feeShares[0].basisPoints).to.equal(6_000);
      expect(config.feeShares[1].basisPoints).to.equal(4_000);
    });
  });
});
