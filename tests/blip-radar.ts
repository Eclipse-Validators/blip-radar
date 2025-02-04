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
  // anchor.setProvider(anchor.AnchorProvider.env());

  const conn = new anchor.web3.Connection(
    "https://eclipse.helius-rpc.com",
    "confirmed"
  );
  const payer = new anchor.web3.Keypair();
  anchor.setProvider(new anchor.AnchorProvider(conn, new anchor.Wallet(payer)));
  const program = anchor.workspace.BlipRadar as Program<BlipRadar>;
  const authority = loadAuthorityWallet();

  // const program = anchor.workspace.BlipRadar as Program<BlipRadar>;

  it("Is initialized!", async () => {
    const asset = anchor.web3.Keypair.generate();
    // https://staging-rpc.dev2.eclipsenetwork.xyz
    const feeAccount = new anchor.web3.PublicKey(
      "6juCmFHoPnJTzhjJfcjFhCXeptCE89vp9dHP91EUaxR8"
    );

    const receiverAccount = anchor.web3.Keypair.generate();

    const authority = loadAuthorityWallet();
    console.log("authority", authority.publicKey);
    // const receiverSig = await conn.requestAirdrop(
    //   receiverAccount.publicKey,
    //   1_000_000 * 1
    // );
    // const payerSig = await conn.requestAirdrop(
    //   payer.publicKey,
    //   1_000_000_000 * 1
    // );

    // console.log("payer", payer.publicKey);
    // console.log("reciever", receiverAccount.publicKey);

    // await conn.confirmTransaction(receiverSig);
    // await conn.confirmTransaction(payerSig);

    const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    const [feeEscrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("fee_escrow")],
      program.programId
    );

    // const devnetfeeShares = [
    //   {
    //     basisPoints: 2000, // 20%
    //     destination: new anchor.web3.PublicKey(
    //       "6juCmFHoPnJTzhjJfcjFhCXeptCE89vp9dHP91EUaxR8"
    //     ),
    //   },
    //   {
    //     basisPoints: 4000, // 40%
    //     destination: new anchor.web3.PublicKey(
    //       "2fHVCcy4A9bZkw3Qi95wmoMXuSBLiHaJu46gxYxgKnZT"
    //     ),
    //   },
    //   {
    //     basisPoints: 4000, // 40%
    //     destination: new anchor.web3.PublicKey(
    //       "BuMrvwBhVqjgvNFBkBnU1nvL4xNQCJaRBa1Lsz396gv6"
    //     ),
    //   },
    // ];

    const feeShares = [
      {
        basisPoints: 1250, // 12.5%
        destination: new anchor.web3.PublicKey(
          "CPv8neygsQSpXmxJ8QDLZvjmAnyqL8in6WLkPK7eKmfu"
        ),
      },
      {
        basisPoints: 4000, // 40%
        destination: new anchor.web3.PublicKey(
          "2fHVCcy4A9bZkw3Qi95wmoMXuSBLiHaJu46gxYxgKnZT"
        ),
      },
      {
        basisPoints: 4000, // 40%
        destination: new anchor.web3.PublicKey(
          "BuMrvwBhVqjgvNFBkBnU1nvL4xNQCJaRBa1Lsz396gv6"
        ),
      },
      {
        basisPoints: 750, // 7.5%
        destination: new anchor.web3.PublicKey(
          "6juCmFHoPnJTzhjJfcjFhCXeptCE89vp9dHP91EUaxR8"
        ),
      },
      // put treasury here to capture dust on math calc rounding
    ];

    const tx2 =await program.methods
      .initConfig(new anchor.BN(700_000), feeShares) // 0.001 SOL fee
      .accounts({
        authority: authority.publicKey,
        config: configPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authority])
      .rpc({
        skipPreflight: true,
      });

    console.log("tx2", tx2);

    //     100%
    // 12.5% Statik
    // 7.5% Blip Treasury
    // 6juCmFHoPnJTzhjJfcjFhCXeptCE89vp9dHP91EUaxR8
    // 40% Lucas BuMrvwBhVqjgvNFBkBnU1nvL4xNQCJaRBa1Lsz396gv6
    // 40% Hammer

    // 2fHVCcy4A9bZkw3Qi95wmoMXuSBLiHaJu46gxYxgKnZT

    // const tx = await program.methods
    //   .sendBlip(
    //     "https://arweave.net/8FDIo_3e5EJBx_1Nq9tdeZ1XZHN2_3GDomncAYKw1jM"
    //   )
    //   .accounts({
    //     asset: asset.publicKey,
    //     payer: payer.publicKey,
    //     receiver: receiverAccount.publicKey,
    //     feeEscrow: feeEscrowPda,
    //     config: configPda,
    //     collection: new anchor.web3.PublicKey(
    //       "HZp57kjtHqxptkn5KL4nJsZV5LYvGWb2oteGtB3t93wy"
    //     ),
    //     collectionAuthority: authority.publicKey,
    //     mplCoreProgram: new anchor.web3.PublicKey(
    //       "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
    //     ),
    //     systemProgram: anchor.web3.SystemProgram.programId,
    //   })
    //   .remainingAccounts([
    //     {
    //       pubkey: new anchor.web3.PublicKey(
    //         "CPv8neygsQSpXmxJ8QDLZvjmAnyqL8in6WLkPK7eKmfu"
    //       ),
    //       isWritable: true,
    //       isSigner: false,
    //     },
    //     {
    //       pubkey: new anchor.web3.PublicKey(
    //         "2fHVCcy4A9bZkw3Qi95wmoMXuSBLiHaJu46gxYxgKnZT"
    //       ),
    //       isWritable: true,
    //       isSigner: false,
    //     },
    //     {
    //       pubkey: new anchor.web3.PublicKey(
    //         "BuMrvwBhVqjgvNFBkBnU1nvL4xNQCJaRBa1Lsz396gv6"
    //       ),
    //       isWritable: true,
    //       isSigner: false,
    //     },
    //     {
    //       pubkey: new anchor.web3.PublicKey(
    //         "6juCmFHoPnJTzhjJfcjFhCXeptCE89vp9dHP91EUaxR8"
    //       ),
    //       isWritable: true,
    //       isSigner: false,
    //     },
    //   ])
    //   .signers([asset, payer, authority])
    //   .rpc();
    // console.log("Your transaction signature", tx);
  });
  // describe("init_config", () => {
  //   before(async () => {
  //     await requestAirdrop(program.provider.connection, authority.publicKey);
  //   });

  //   it("fails when fee shares exceed maximum allowed", async () => {
  //     const feeShares = Array(6).fill({
  //       basisPoints: 1000,
  //       destination: anchor.web3.Keypair.generate().publicKey,
  //     });

  //     const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
  //       [Buffer.from("config")],
  //       program.programId
  //     );

  //     try {
  //       await program.methods
  //         .initConfig(new anchor.BN(100000), feeShares)
  //         .accounts({
  //           authority: authority.publicKey,
  //           config: configPda,
  //           systemProgram: anchor.web3.SystemProgram.programId,
  //         })
  //         .signers([authority])
  //         .rpc();
  //       expect.fail("Should have failed with too many fee shares");
  //     } catch (err) {
  //       expect(err.message).to.include("TooManyFeeShares");
  //     }
  //   });

  //   it("fails when total basis points exceed 10000", async () => {
  //     const feeShares = [
  //       {
  //         basisPoints: 6000, // 60%
  //         destination: anchor.web3.Keypair.generate().publicKey,
  //       },
  //       {
  //         basisPoints: 5000, // 50%
  //         destination: anchor.web3.Keypair.generate().publicKey,
  //       },
  //     ];

  //     const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
  //       [Buffer.from("config")],
  //       program.programId
  //     );

  //     try {
  //       await program.methods
  //         .initConfig(new anchor.BN(100000), feeShares)
  //         .accounts({
  //           authority: authority.publicKey,
  //           config: configPda,
  //           systemProgram: anchor.web3.SystemProgram.programId,
  //         })
  //         .signers([authority])
  //         .rpc();
  //       expect.fail("Should have failed with invalid basis points");
  //     } catch (err) {
  //       expect(err.message).to.include("InvalidFeeBasisPoints");
  //     }
  //   });

  //   it("fails when called by non-admin authority", async () => {
  //     const nonAdmin = anchor.web3.Keypair.generate();
  //     const feeShares = [
  //       {
  //         basisPoints: 5000,
  //         destination: anchor.web3.Keypair.generate().publicKey,
  //       },
  //     ];

  //     const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
  //       [Buffer.from("config")],
  //       program.programId
  //     );

  //     try {
  //       await program.methods
  //         .initConfig(new anchor.BN(100000), feeShares)
  //         .accounts({
  //           authority: nonAdmin.publicKey,
  //           config: configPda,
  //           systemProgram: anchor.web3.SystemProgram.programId,
  //         })
  //         .signers([nonAdmin])
  //         .rpc();
  //       expect.fail("Should have failed with incorrect authority");
  //     } catch (err) {
  //       console.log(err);
  //       expect(err.message).to.include("IncorrectAuthority");
  //     }
  //   });

  //   // NOTE: this must be the last test because the other failure tests will
  //   // cause anchor to error trying to initialize an account that already exists
  //   it("successfully initializes config with valid fee shares", async () => {
  //     const feeDestination1 = anchor.web3.Keypair.generate();
  //     const feeDestination2 = anchor.web3.Keypair.generate();

  //     const feeShares = [
  //       {
  //         basisPoints: 6_000, // 60%
  //         destination: feeDestination1.publicKey,
  //       },
  //       {
  //         basisPoints: 4_000, // 40%
  //         destination: feeDestination2.publicKey,
  //       },
  //     ];

  //     const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
  //       [Buffer.from("config")],
  //       program.programId
  //     );

  //     await program.methods
  //       .initConfig(new anchor.BN(100_000), feeShares) // .001
  //       .accounts({
  //         authority: authority.publicKey,
  //         config: configPda,
  //         systemProgram: anchor.web3.SystemProgram.programId,
  //       })
  //       .signers([authority])
  //       .rpc({
  //         skipPreflight: true,
  //       });

  //     const config = await program.account.blipConfig.fetch(configPda);
  //     expect(config.feeLamports.toString()).to.equal("100000");
  //     expect(config.feeShares).to.have.length(2);
  //     expect(config.feeShares[0].basisPoints).to.equal(6_000);
  //     expect(config.feeShares[1].basisPoints).to.equal(4_000);
  //   });
  // });

  // describe("send_blip", () => {
  //   let configPda: PublicKey;
  //   let feeEscrowPda: PublicKey;
  //   const feeDestination1 = anchor.web3.Keypair.generate();
  //   const feeDestination2 = anchor.web3.Keypair.generate();
  //   const feeDestination3 = anchor.web3.Keypair.generate();

  //   before(async () => {
  //     // Setup config with 3 fee shares
  //     [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
  //       [Buffer.from("config")],
  //       program.programId
  //     );

  //     [feeEscrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
  //       [Buffer.from("fee_escrow")],
  //       program.programId
  //     );

  //     // Airdrop to authority for creating config
  //     await requestAirdrop(program.provider.connection, authority.publicKey);

  //     const feeShares = [
  //       {
  //         basisPoints: 5000, // 50%
  //         destination: feeDestination1.publicKey,
  //       },
  //       {
  //         basisPoints: 3000, // 30%
  //         destination: feeDestination2.publicKey,
  //       },
  //       {
  //         basisPoints: 2000, // 20%
  //         destination: feeDestination3.publicKey,
  //       },
  //     ];

  //     await program.methods
  //       .initConfig(new anchor.BN(1_000_000), feeShares) // 0.01 SOL fee
  //       .accounts({
  //         authority: authority.publicKey,
  //         config: configPda,
  //         systemProgram: anchor.web3.SystemProgram.programId,
  //       })
  //       .signers([authority])
  //       .rpc();
  //   });

  //   it("successfully sends blip and distributes fees", async () => {
  //     const asset = anchor.web3.Keypair.generate();
  //     const payer = anchor.web3.Keypair.generate();
  //     const receiver = anchor.web3.Keypair.generate();

  //     // Airdrop to payer to cover fees
  //     await requestAirdrop(
  //       program.provider.connection,
  //       payer.publicKey,
  //       2 * LAMPORTS_PER_SOL
  //     );

  //     // Get initial balances
  //     const initialBalance1 = await program.provider.connection.getBalance(
  //       feeDestination1.publicKey
  //     );
  //     const initialBalance2 = await program.provider.connection.getBalance(
  //       feeDestination2.publicKey
  //     );
  //     const initialBalance3 = await program.provider.connection.getBalance(
  //       feeDestination3.publicKey
  //     );

  //     await program.methods
  //       .sendBlip("https://example.com/asset.json")
  //       .accounts({
  //         asset: asset.publicKey,
  //         payer: payer.publicKey,
  //         receiver: receiver.publicKey,
  //         feeEscrow: feeEscrowPda,
  //         config: configPda,
  //         collection: new anchor.web3.PublicKey(
  //           "HZp57kjtHqxptkn5KL4nJsZV5LYvGWb2oteGtB3t93wy"
  //         ),
  //         collectionAuthority: authority.publicKey,
  //         mplCoreProgram: new anchor.web3.PublicKey(
  //           "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
  //         ),
  //         systemProgram: anchor.web3.SystemProgram.programId,
  //       })
  //       .remainingAccounts([
  //         {
  //           pubkey: feeDestination1.publicKey,
  //           isWritable: true,
  //           isSigner: false,
  //         },
  //         {
  //           pubkey: feeDestination2.publicKey,
  //           isWritable: true,
  //           isSigner: false,
  //         },
  //         {
  //           pubkey: feeDestination3.publicKey,
  //           isWritable: true,
  //           isSigner: false,
  //         },
  //       ])
  //       .signers([asset, payer, authority])
  //       .rpc({
  //         skipPreflight: true,
  //       });

  //     const finalBalance1 = await program.provider.connection.getBalance(
  //       feeDestination1.publicKey
  //     );
  //     const finalBalance2 = await program.provider.connection.getBalance(
  //       feeDestination2.publicKey
  //     );
  //     const finalBalance3 = await program.provider.connection.getBalance(
  //       feeDestination3.publicKey
  //     );

  //     expect(finalBalance1 - initialBalance1).to.equal(500_000); // 50% of 1 SOL
  //     expect(finalBalance2 - initialBalance2).to.equal(300_000); // 30% of 1 SOL
  //     expect(finalBalance3 - initialBalance3).to.equal(200_000); // 20% of 1 SOL
  //   });
  // });
});
