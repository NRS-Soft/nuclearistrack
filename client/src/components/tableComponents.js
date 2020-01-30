// tableComponents.js
import styled from 'styled-components';

const Table = styled.div`
  padding: 20px 0;
  margin-top: 75px;
  width: 100%;
  background: #e6e6e6;
  text-align: left;
`;

const Row = styled.div`
  padding: 1px 0;
  box-sizing: border-box;
  width: 100%;
  text-align: left;
  display: flex;
  font-size: 13px;
  letter-spacing: 0.5px;
  color: #333;
  cursor: pointer;
  &.active {
    font-weight: 700;
  }
`;

const HeadRow = styled(Row)`
  color: #8c6239;
  font-weight: 700;
  padding: 4px 0;
`;

const HeadRowMonsterrat = styled(HeadRow)`
  font-family: Montserrat, sans-serif;
  width: calc(100% - 14px);
`;

const Col = styled.div`
  width: 20%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

const Col2 = styled.div`
  padding:3px 0;
  &.bold{font-weight:700; calc(100% - 120px);}
  &.color{color:#8c6239; width:130px;}
`;
const Col3 = styled.div`
  width: 33%;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  a {
    text-decoration: none;
    color: #333;
  }
  a:hover {
    color: #8c6239;
  }
  svg {
    width: 20px;
    vertical-align: middle;
    margin-right: 5px;
  }
  svg .st0 {
    fill: #333;
  }
  a:hover svg .st0 {
    fill: #8c6239;
  }
`;

const Col4 = styled(Col3)`
  width: 25%;
`;

export { Table, Row, HeadRow, HeadRowMonsterrat, Col, Col2, Col3, Col4 };