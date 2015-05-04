This is a basic Dropbox clone to sync files across multiple remote folders.

Time spent: 12 Hrs

**Features**<BR/>
**Required**<BR/>
[Done] Client can make GET requests to get file or directory contents<BR/>
[Done] Client can make HEAD request to get just the GET headers<BR/>
[Done] Client can make PUT requests to create new directories and files with content<BR/>
[Done] Client can make POST requests to update the contents of a file<BR/>
[Done] Client can make DELETE requests to delete files and folders<BR/>
[Done] Server will serve from --dir or cwd as root<BR/>
[Done] Client will sync from server over TCP to cwd or CLI dir argument<BR/>

**Optional**<BR/>
[Pending] Client and User will be redirected from HTTP to HTTPS<BR/>
[Pending] Server will sync from client over TCP<BR/>
[Pending] Client will preserve a 'Conflict' file when pushed changes preceeding local edits<BR/>
[Pending] Client can stream and scrub video files (e.g., on iOS)<BR/>
[Pending] Client can download a directory as an archive<BR/>
[Pending] Client can create a directory with an archive<BR/>
[Pending] User can connect to the server using an FTP client<BR/>

**Walkthrough**<BR/>
Please zoom in if image is not visible. Sorry for inconvenience. (Image Location - https://github.com/vasupalanisamy/dropbox-clone/blob/master/dropbox-clone.gif)
![alt tag](https://github.com/vasupalanisamy/dropbox-clone/blob/master/dropbox-clone.gif)
