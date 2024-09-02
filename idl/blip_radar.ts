/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/blip_radar.json`.
 */
export type BlipRadar = {
  "address": "rdr1DeFWkwG6nQfammDLTzRT6uW32t7yEHWCmcr49Df",
  "metadata": {
    "name": "blipRadar",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "sendBlip",
      "discriminator": [
        31,
        195,
        67,
        8,
        119,
        108,
        224,
        12
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "receiver"
        },
        {
          "name": "feeDestination",
          "writable": true
        },
        {
          "name": "asset",
          "writable": true,
          "signer": true
        },
        {
          "name": "collection",
          "writable": true
        },
        {
          "name": "collectionAuthority",
          "signer": true
        },
        {
          "name": "mplCoreProgram",
          "address": "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "assetJsonUri",
          "type": "string"
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAuthority",
      "msg": "Invalid Authority"
    },
    {
      "code": 6001,
      "name": "invalidFeeDestination",
      "msg": "Invalid Fee Destination"
    }
  ]
};
