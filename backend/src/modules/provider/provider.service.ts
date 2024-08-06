import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class ProviderService {
  private readonly url = `https://scroll-sepolia.blockpi.network/v1/rpc/64e6310d6e6234d8d05d9afcdc60a5ddab5a05a9`;
  public provider: ethers.providers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(this.url);
  }
}
