import {mkdtemp,chmod,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {it,expect,vi} from 'vitest';
import {PrivateSourceStorage} from '../modules/imports/private-source-storage.js';
it('kegagalan unlink tidak menutupi sebab asli dan diagnostik tidak menerima payload',async()=>{
  const root=await mkdtemp(join(tmpdir(),'siris-cleanup-'));
  const notify=vi.fn();const cause=new Error('private-source-payload');
  try {
    const content=(async function*(){yield Buffer.from('UJI');await chmod(root,0o500);throw cause;})();
    await expect(new PrivateSourceStorage(root,notify).write(content,100)).rejects.toBe(cause);
    expect(notify).toHaveBeenCalledExactlyOnceWith();
  }finally{await chmod(root,0o700);await rm(root,{recursive:true,force:true});}
});
