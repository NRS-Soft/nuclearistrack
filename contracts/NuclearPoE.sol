pragma solidity >=0.5.0 <0.7.0;

//Contrato general que manejo los subcontratos que se crean en runtime
contract NuclearPoE {

    address payable private owner;

    constructor() public {
      owner = msg.sender;
    }

    struct ProjectStruct {
        address contractAddress;
        bool created;
    }

    struct ClientStruct {
        address contractAddress;
        bool created;
    }

    struct SupplierStruct {
        address contractAddress;
        bool created;
    }

    mapping(uint => ProjectStruct) private projectContracts;
    mapping(address => ClientStruct) private client;
    mapping(address => SupplierStruct) private supplier;

    address[] public projectContractsArray;
    address[] private supplierContractsArray;
    address[] private clientContractsArray;
    uint8 public projectCount;
    uint8 private clientCount;
    uint8 private supplierCount;

    modifier onlyOwner() {
    require(msg.sender == owner,"Only owner can make this change");_;
    }

    event CreateProject(address newProjectContractAddress);
    event CreateClient(address ContractAddress);
    event CreateSupplier(address ContractAddress);


    function createProject(uint _expediente, bytes32 _projectTitle, address _clientAddress) external onlyOwner() {
        require(projectContracts[_expediente].created == false, "Project already created");
        require(client[_clientAddress].created == true, "Client does not exist");

        address ProjectContractAddress = address(new Project(_expediente, _projectTitle, _clientAddress));
        projectContracts[_expediente] = ProjectStruct(ProjectContractAddress, true);

        Client clientContractInstance = Client(client[_clientAddress].contractAddress);

        clientContractInstance.addProject(ProjectContractAddress);

        projectContractsArray.push(ProjectContractAddress);
        projectCount++;

        emit CreateProject(ProjectContractAddress);
    }

    function kill() public onlyOwner() {
        selfdestruct(owner);
    }

    function createSupplier(address _supplierAddress, bytes32 _supplierName) external onlyOwner() {
        require(supplier[_supplierAddress].created == false,"Supplier already created");

        address ContractAddress = address(new Supplier(_supplierName, _supplierAddress));

        supplier[_supplierAddress] = SupplierStruct(ContractAddress, true);
        supplierCount++;

        emit CreateSupplier(ContractAddress);
    }

    function createClient(address _clientAddress, bytes32 _clientName) external onlyOwner() {
        require(client[_clientAddress].created == false,"Client already created");

        address ContractAddress = address(new Client(_clientName, _clientAddress));

        client[_clientAddress] = ClientStruct(ContractAddress, true);
        clientCount++;

        emit CreateClient(ContractAddress);
    }

    function addProcessToProject(address _supplierAddress, address _projectContractAddress, bytes32 _processName, bytes32 _supplierName) external onlyOwner() {
        require(supplier[_supplierAddress].created == true,"Supplier does not exist");

        Supplier supplierContractInstance = Supplier(supplier[_supplierAddress].contractAddress);
        supplierContractInstance.addProject(_projectContractAddress);

        Project project = Project(_projectContractAddress);
        project.addProcess(_supplierAddress, _processName, _supplierName);
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

    function addDocument (address _supplierAddress, bytes32 _hash, bytes32 _documentName) external {
        require(approved == true,"Project is not approved by client");
        require(process[_supplierAddress].created == true, "Process does not exist");
        require(document[_hash].created == false, "Document already created");

        document[_hash] = Document(_supplierAddress, _documentName, now, true);
        allDocuments.push(_hash);
        documentQty++;
        emit AddDocument();
    }


    function findDocument(bytes32 _hash) external view returns (address, uint, bytes32) {
        require(document[_hash].created == true, "Document does not exist");
        return (
            document[_hash].supplierAddress,
            document[_hash].mineTime,
            document[_hash].documentTitle
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
contract Client {

    bytes32 private name;
    address private clientAddress;
    address[] private projectAddresses;
    uint private projectCount;
    address payable owner;

    constructor (bytes32 _name, address _address) public {
        name = _name;
        clientAddress = _address;
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

// Contrato de proveedores que se genera para cada proveedor nuevo y hace seguimiento a los proyectos nuevos asignados
contract Supplier {

    bytes32 private name;
    address private supplierAddress;
    address[] private projectAddresses;
    uint private projectCount;
    address payable owner;

    constructor (bytes32 _name, address _address) public {
        name = _name;
        supplierAddress = _address;
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