pragma solidity >=0.5.0 <0.7.0;

//Contrato general que manejo los subcontratos que se crean en runtime
contract NuclearPoE {

    address payable private owner;
    enum UserType {Client, Supplier, User}

    constructor() public {
      owner = msg.sender;
    }

    struct ProjectStruct {
        address contractAddress;
        bool created;
    }

    struct UserStruct {
        address contractAddress;
        uint8 userType;
        bool created;
    }


    mapping(uint => ProjectStruct) private projectContracts;
    mapping(address => UserStruct) private user;

    address[] public projectContractsArray;
    address[] private userContractsArray;
    uint8 public projectCount;
    uint8 private userCount;

    modifier onlyOwner() {
    require(msg.sender == owner,"Only owner can make this change");_;
    }

    event CreateProject(address newProjectContractAddress);
    event CreateUser(address ContractAddress);


    function createProject(uint _expediente, bytes32 _projectTitle, address _userAddress) external onlyOwner() {
        require(projectContracts[_expediente].created == false, "Project already created");
        require(user[_userAddress].created == true, "User does not exist");

        address ProjectContractAddress = address(new Project(_expediente, _projectTitle, _userAddress));
        projectContracts[_expediente] = ProjectStruct(ProjectContractAddress, true);

        User userContractInstance = User(user[_userAddress].contractAddress);

        userContractInstance.addProject(ProjectContractAddress);

        projectContractsArray.push(ProjectContractAddress);
        projectCount++;

        emit CreateProject(ProjectContractAddress);
    }

    function kill() public onlyOwner() {
        selfdestruct(owner);
    }

    function createUser(address _userAddress, bytes32 _userName, uint8 userType) external onlyOwner() {
        require(user[_userAddress].created == false,"User already created");

        address ContractAddress = address(new User(_userName, _userAddress));

        user[_userAddress] = UserStruct(ContractAddress, userType, true);
        userCount++;

        emit CreateUser(ContractAddress);
    }

    function addProcessToProject(address _address, address _projectContractAddress, bytes32 _processName, bytes32 _userName) external onlyOwner() {
        require(user[_address].created == true,"User does not exist");

        User userContractInstance = User(user[_address].contractAddress);
        userContractInstance.addProject(_projectContractAddress);

        Project project = Project(_projectContractAddress);
        project.addProcess(_address, _processName, _userName);
    }
}

// Contrato de proyectos, cada vez que se crea un proyecto nuevo se debe generar un contrato proyecto.
contract Project {

    uint private expediente;
    bool private approved;
    address private clientAddress;
    bytes32 private title;
    address payable owner;

    struct Document {
        address supplierAddress;
        bytes32 documentTitle;
        bytes32 storageHash;
        uint storageFunction;
        uint storageSize;
        uint mineTime;
        bool created;
    }

    struct Process {
        bytes32 processName;
        bytes32 supplierName;
        address supplierAddress;
        bool created;
    }

    uint private supplierCount;
    uint private documentQty;
    address[] private supplierAddresses;
    bytes32[] private allDocuments;

    mapping(address => Process) private process;
    mapping(bytes32 => Document) private document;

    event AddDocument();
    event AddProcess();
    event ApproveProject();

    constructor (uint _expediente, bytes32 _title,address _clientAddress) public {
        expediente = _expediente;
        title = _title;
        clientAddress = _clientAddress;
    }

    function addDocument (address _supplierAddress, bytes32 _hash, bytes32 _documentName, bytes32 storageHash, uint storageFunction, uint storageSize) external {
        require(approved == true,"Project is not approved by client");
        require(process[_supplierAddress].created == true, "Process does not exist");
        require(document[_hash].created == false, "Document already created");

        document[_hash] = Document(_supplierAddress, _documentName, storageHash, storageFunction, storageSize, now, true);
        allDocuments.push(_hash);
        documentQty++;
        emit AddDocument();
    }


    function findDocument(bytes32 _hash) external view returns (address, uint, bytes32, bytes32, uint, uint) {
        require(document[_hash].created == true, "Document does not exist");
        return (
            document[_hash].supplierAddress,
            document[_hash].mineTime,
            document[_hash].documentTitle,
            document[_hash].storageHash,
            document[_hash].storageFunction,
            document[_hash].storageSize
            );
    }

    // TEMP
    function kill() public {
        selfdestruct(msg.sender);
    }

    function approveProject() external {
        require(msg.sender == clientAddress,"Only clients of this project can realize this operation");
        require(approved == false,"Project already approved");
        approved = true;
        emit ApproveProject();
    }

    function addProcess(address _supplierAddress, bytes32 _processName, bytes32 _supplierName) external {
        require(process[_supplierAddress].created == false,"Process already created");
        require(approved == false,"Project is already approved by client");

        supplierCount++;
        supplierAddresses.push(_supplierAddress);
        process[_supplierAddress] = Process(_processName, _supplierName, _supplierAddress, true);

        emit AddProcess();
    }

    function contractDetails() external view returns (uint, address, address, bytes32, bool, bytes32[] memory, address[] memory) {
        return (expediente, address(this), clientAddress, title, approved, allDocuments, supplierAddresses);
    }

    function returnAllDocuments() external view returns(bytes32[] memory) {
        return allDocuments;
    }
}


// Contrato de cliente que se genera para cada cliente nuevo y hace seguimiento a los proyectos nuevos asignados
contract User {

    bytes32 private name;
    address private userAddress;
    address[] private projectAddresses;
    uint private projectCount;
    address payable owner;

    constructor (bytes32 _name, address _address) public {
        name = _name;
        userAddress = _address;
    }

    function contractDetails() external view returns (bytes32, address[] memory) {
        return (name, projectAddresses);
    }

    // TEMP
    function kill() public {
        selfdestruct(msg.sender);
    }

    function addProject(address _a) external {
        projectAddresses.push(_a);
        projectCount++;
    }

}